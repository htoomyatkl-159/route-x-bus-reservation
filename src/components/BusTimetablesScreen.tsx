import React, { useState, useMemo } from 'react';
import { Route, TripSchedule, CityName, BusType } from '../types';
import { INITIAL_ROUTES, generateSchedulesForDate } from '../data/mockData';

interface BusTimetablesScreenProps {
  routes?: Route[];
  schedules?: TripSchedule[];
  onSelectTrip?: (trip: TripSchedule) => void;
  onSearchRoute?: (fromCity: CityName, toCity: CityName, date: string) => void;
  onBack: () => void;
}

type TimeCategory = 'All' | 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export const BusTimetablesScreen: React.FC<BusTimetablesScreenProps> = ({
  routes = INITIAL_ROUTES,
  schedules = [],
  onSelectTrip,
  onSearchRoute,
  onBack,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('All');
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<TimeCategory>('All');
  const [selectedBusType, setSelectedBusType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Daily schedules: generate for selected date if not provided in props
  const allSchedules = useMemo(() => {
    if (schedules && schedules.length > 0) {
      // If provided schedules match selected date, use them, otherwise generate
      const matching = schedules.filter((s) => s.travelDate === selectedDate);
      if (matching.length > 0) return matching;
    }
    return generateSchedulesForDate(selectedDate);
  }, [schedules, selectedDate]);

  // Group schedules by routeId
  const routeGroups = useMemo(() => {
    const list = routes && routes.length > 0 ? routes : INITIAL_ROUTES;

    return list.map((route) => {
      const routeSchedules = allSchedules.filter(
        (s) =>
          (s.routeId === route.id ||
            (s.fromCity === route.fromCity && s.toCity === route.toCity)) &&
          (selectedTimeCategory === 'All' ||
            (selectedTimeCategory === 'Morning' && (s.departureTime.includes('AM') && !s.departureTime.startsWith('12'))) ||
            (selectedTimeCategory === 'Afternoon' && (s.departureTime.includes('01:') || s.departureTime.includes('02:') || s.departureTime.includes('03:') || s.departureTime.includes('04:') || s.departureTime.includes('05:')) && s.departureTime.includes('PM')) ||
            (selectedTimeCategory === 'Evening' && (s.departureTime.includes('06:') || s.departureTime.includes('07:') || s.departureTime.includes('08:')) && s.departureTime.includes('PM')) ||
            (selectedTimeCategory === 'Night' && (s.departureTime.includes('09:') || s.departureTime.includes('10:') || s.departureTime.includes('11:')) && s.departureTime.includes('PM'))) &&
          (selectedBusType === 'All' || s.busType === selectedBusType)
      );

      return {
        route,
        schedules: routeSchedules,
      };
    });
  }, [routes, allSchedules, selectedTimeCategory, selectedBusType]);

  // Filter routes based on route selector and text search query
  const filteredRouteGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return routeGroups.filter(({ route, schedules: rSchedules }) => {
      // 1. Route filter selector
      if (selectedRouteFilter !== 'All') {
        const routeKey1 = `${route.fromCity}-${route.toCity}`;
        const routeKey2 = `${route.toCity}-${route.fromCity}`;
        if (selectedRouteFilter !== routeKey1 && selectedRouteFilter !== routeKey2 && selectedRouteFilter !== route.id) {
          return false;
        }
      }

      // 2. Search query filter
      if (query) {
        const matchesFrom = route.fromCity.toLowerCase().includes(query);
        const matchesTo = route.toCity.toLowerCase().includes(query);
        const matchesTerminalFrom = route.fromTerminal.toLowerCase().includes(query);
        const matchesTerminalTo = route.toTerminal.toLowerCase().includes(query);
        const matchesBus = rSchedules.some(
          (s) =>
            s.busName.toLowerCase().includes(query) ||
            s.busCode.toLowerCase().includes(query) ||
            s.busType.toLowerCase().includes(query)
        );

        if (!matchesFrom && !matchesTo && !matchesTerminalFrom && !matchesTerminalTo && !matchesBus) {
          return false;
        }
      }

      return true;
    });
  }, [routeGroups, selectedRouteFilter, searchQuery]);

  const totalSchedulesCount = useMemo(() => {
    return filteredRouteGroups.reduce((acc, curr) => acc + curr.schedules.length, 0);
  }, [filteredRouteGroups]);

  // Tomorrow string for quick date tabs
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const handleResetFilters = () => {
    setSelectedRouteFilter('All');
    setSelectedTimeCategory('All');
    setSelectedBusType('All');
    setSearchQuery('');
    setSelectedDate(todayStr);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-low dark:bg-slate-800 text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Go Back"
            aria-label="Back to home"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
              <span>Home</span>
              <span>•</span>
              <span className="text-secondary dark:text-teal-400 font-semibold">Bus Timetables</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-primary dark:text-white tracking-tight flex items-center gap-2">
              <span>Daily Bus Timetables</span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary dark:bg-teal-950 dark:text-teal-300 border border-secondary/20">
                Live Schedules
              </span>
            </h1>
          </div>
        </div>

        {/* Date Selector Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-secondary text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container'
            }`}
          >
            Today ({todayStr})
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === tomorrowStr
                ? 'bg-secondary text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container'
            }`}
          >
            Tomorrow
          </button>
          <input
            type="date"
            value={selectedDate}
            min={todayStr}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-xl border border-outline-variant dark:border-slate-700 bg-surface dark:bg-slate-800 text-on-surface dark:text-slate-200 cursor-pointer"
            title="Choose specific travel date"
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-4 md:p-5 border border-surface-container-high dark:border-slate-800 shadow-xs space-y-4">
        {/* Search row */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by city (e.g. Yangon, Mandalay), terminal, or bus name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs md:text-sm rounded-xl border border-outline-variant/80 dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-950 text-on-surface dark:text-white placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-secondary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer text-xs"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
              </button>
            )}
          </div>

          {/* Time slot filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(['All', 'Morning', 'Afternoon', 'Evening', 'Night'] as TimeCategory[]).map((timeCat) => (
              <button
                key={timeCat}
                type="button"
                onClick={() => setSelectedTimeCategory(timeCat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTimeCategory === timeCat
                    ? 'bg-primary dark:bg-teal-600 text-white shadow-xs'
                    : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container'
                }`}
              >
                {timeCat === 'All' ? 'All Times' : timeCat}
              </button>
            ))}
          </div>

          {/* Bus Class filter */}
          <select
            value={selectedBusType}
            onChange={(e) => setSelectedBusType(e.target.value)}
            className="w-full md:w-44 px-3 py-2 text-xs rounded-xl border border-outline-variant/80 dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-950 text-on-surface dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Bus Classes</option>
            <option value="VIP Seating">VIP Seating</option>
            <option value="Luxury Suite">Luxury Suite</option>
            <option value="Standard AC">Standard AC</option>
          </select>
        </div>

        {/* Quick Route Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-on-surface-variant dark:text-slate-400 font-semibold shrink-0 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">route</span>
            Popular:
          </span>
          {[
            { label: 'All Routes', value: 'All' },
            { label: 'Yangon ⇄ Mandalay', value: 'Yangon-Mandalay' },
            { label: 'Yangon ⇄ Taunggyi', value: 'Yangon-Taunggyi' },
            { label: 'Yangon ⇄ Bago', value: 'Yangon-Bago' },
            { label: 'Yangon ⇄ Myeik', value: 'Yangon-Myeik' },
            { label: 'Mandalay ⇄ Taunggyi', value: 'Mandalay-Taunggyi' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSelectedRouteFilter(item.value)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRouteFilter === item.value
                  ? 'bg-secondary text-white font-bold shadow-xs'
                  : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-secondary/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Schedules Count Summary */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant dark:text-slate-400 px-1">
        <p>
          Showing <span className="font-bold text-primary dark:text-white">{filteredRouteGroups.length}</span> routes
          and <span className="font-bold text-primary dark:text-white">{totalSchedulesCount}</span> scheduled departures
          for <span className="font-semibold text-secondary dark:text-teal-300">{selectedDate}</span>
        </p>
        {(selectedRouteFilter !== 'All' || selectedTimeCategory !== 'All' || selectedBusType !== 'All' || searchQuery) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-secondary dark:text-teal-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">restart_alt</span>
            Reset Filters
          </button>
        )}
      </div>

      {/* Routes & Timetables Listing */}
      {filteredRouteGroups.length === 0 || totalSchedulesCount === 0 ? (
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-outline-variant dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">schedule</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-primary dark:text-white">No departures match your criteria</h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your route filter, clearing your search query, or selecting another departure time.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-[#00504c] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredRouteGroups.map(({ route, schedules: rSchedules }) => {
            if (rSchedules.length === 0) return null;

            return (
              <section
                key={route.id}
                className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-surface-container-high dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:shadow-md"
              >
                {/* Route Header Banner */}
                <div className="bg-surface-container-low dark:bg-slate-800/80 px-5 py-4 border-b border-outline-variant/50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base md:text-lg font-black text-primary dark:text-white tracking-tight flex items-center gap-2">
                        <span>{route.fromCity}</span>
                        <span className="material-symbols-outlined text-secondary dark:text-teal-400 text-base">
                          arrow_forward
                        </span>
                        <span>{route.toCity}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary dark:bg-slate-700 dark:text-slate-200">
                        Daily Express
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs text-secondary">location_on</span>
                        {route.fromTerminal}
                      </span>
                      <span>→</span>
                      <span>{route.toTerminal}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto text-xs">
                    <div className="text-right">
                      <span className="text-on-surface-variant dark:text-slate-400 block text-[10px]">Route Info</span>
                      <span className="font-semibold text-primary dark:text-white">
                        {route.distanceKm} km • ~{route.durationText}
                      </span>
                    </div>

                    {onSearchRoute && (
                      <button
                        type="button"
                        onClick={() => onSearchRoute(route.fromCity, route.toCity, selectedDate)}
                        className="px-3 py-1.5 rounded-xl border border-secondary text-secondary dark:text-teal-300 text-xs font-bold hover:bg-secondary/10 transition-colors cursor-pointer flex items-center gap-1"
                        title="Search all available buses for this route"
                      >
                        <span className="material-symbols-outlined text-sm">search</span>
                        Search Route
                      </button>
                    )}
                  </div>
                </div>

                {/* Schedules Table / Cards for this route */}
                <div className="divide-y divide-outline-variant/30 dark:divide-slate-800/80">
                  {rSchedules.map((schedule) => {
                    const availableSeats = schedule.totalSeats - (schedule.bookedSeats?.length || 0);
                    const isAlmostFull = availableSeats <= 5;

                    return (
                      <div
                        key={schedule.id}
                        className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/40 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Left: Timing & Journey duration */}
                        <div className="flex items-center gap-4 md:gap-6 min-w-[280px]">
                          {/* Departure block */}
                          <div className="text-left">
                            <span className="text-base md:text-lg font-black text-primary dark:text-white">
                              {schedule.departureTime}
                            </span>
                            <span className="text-[11px] text-on-surface-variant dark:text-slate-400 block leading-tight truncate max-w-[130px]">
                              {schedule.fromCity}
                            </span>
                          </div>

                          {/* Arrow & duration bridge */}
                          <div className="flex flex-col items-center justify-center px-1">
                            <span className="text-[10px] text-on-surface-variant dark:text-slate-400 font-semibold mb-0.5">
                              {schedule.durationText}
                            </span>
                            <div className="flex items-center gap-1 text-secondary dark:text-teal-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary dark:bg-teal-400"></span>
                              <span className="w-10 sm:w-16 h-0.5 bg-secondary/40 dark:bg-teal-500/40"></span>
                              <span className="material-symbols-outlined text-xs -ml-1.5">arrow_forward</span>
                            </div>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                              Non-stop
                            </span>
                          </div>

                          {/* Arrival block */}
                          <div className="text-left">
                            <span className="text-base md:text-lg font-black text-primary dark:text-white">
                              {schedule.arrivalTime}
                            </span>
                            <span className="text-[11px] text-on-surface-variant dark:text-slate-400 block leading-tight truncate max-w-[130px]">
                              {schedule.toCity}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Bus details, class, amenities */}
                        <div className="flex-1 space-y-1.5 border-t md:border-t-0 pt-2 md:pt-0 border-outline-variant/30">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-primary dark:text-white flex items-center gap-1">
                              <span className="material-symbols-outlined text-secondary text-sm">directions_bus</span>
                              {schedule.busName}
                            </span>
                            <span className="text-[10px] text-on-surface-variant dark:text-slate-400 font-mono">
                              ({schedule.busCode})
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                schedule.busType === 'Luxury Suite'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                                  : schedule.busType === 'VIP Seating'
                                  ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300/40'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40'
                              }`}
                            >
                              {schedule.busType}
                            </span>
                            {schedule.rating && (
                              <span className="flex items-center text-[11px] font-bold text-amber-500">
                                <span className="material-symbols-outlined text-xs">star</span>
                                {schedule.rating}
                              </span>
                            )}
                          </div>

                          {/* Amenities pills */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-on-surface-variant dark:text-slate-400">
                            {schedule.amenities?.slice(0, 3).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-surface-container-high/60 dark:bg-slate-800 text-[10px]"
                              >
                                {amenity}
                              </span>
                            ))}
                            {schedule.amenities && schedule.amenities.length > 3 && (
                              <span className="text-[10px] font-semibold text-on-surface-variant/70">
                                +{schedule.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Fare and Booking CTA */}
                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                          <div className="text-left md:text-right">
                            <span className="text-xs text-on-surface-variant dark:text-slate-400 block">Ticket Fare</span>
                            <span className="text-base md:text-lg font-black text-secondary dark:text-teal-300">
                              {schedule.priceMMK.toLocaleString()} MMK
                            </span>
                            <span
                              className={`text-[10px] font-bold block ${
                                isAlmostFull ? 'text-error' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {availableSeats} seats available
                            </span>
                          </div>

                          {onSelectTrip && (
                            <button
                              type="button"
                              onClick={() => onSelectTrip(schedule)}
                              className="px-4 py-2 bg-secondary hover:bg-[#00504c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Book Seat</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Terminal Information Directory Footer */}
      <section className="bg-surface-container-low dark:bg-slate-900/60 rounded-3xl p-6 border border-outline-variant/40 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-xl">hub</span>
          <h2 className="text-sm md:text-base font-bold text-primary dark:text-white">
            Express Terminal Directory & Boarding Guidelines
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-surface-container-lowest dark:bg-slate-800 rounded-xl space-y-1">
            <p className="font-bold text-primary dark:text-white">Yangon: Aung Mingalar Terminal</p>
            <p className="text-on-surface-variant dark:text-slate-400">
              Gate 4 & 5, Mingaladon Township. Please arrive 30 minutes prior to departure.
            </p>
          </div>
          <div className="p-3 bg-surface-container-lowest dark:bg-slate-800 rounded-xl space-y-1">
            <p className="font-bold text-primary dark:text-white">Mandalay: Chan Mya Shwe Pyi</p>
            <p className="text-on-surface-variant dark:text-slate-400">
              Kyi Daw Kone Highway station, 73rd Street. Free luggage drop-off available.
            </p>
          </div>
          <div className="p-3 bg-surface-container-lowest dark:bg-slate-800 rounded-xl space-y-1">
            <p className="font-bold text-primary dark:text-white">Taunggyi: Ayetharyar Highway Terminal</p>
            <p className="text-on-surface-variant dark:text-slate-400">
              Main Bus Complex, Ayetharyar Sub-township. Mountain pass routes require ID verification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
