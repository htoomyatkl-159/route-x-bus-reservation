import React, { useState, useMemo } from 'react';
import { TripSchedule, SearchParams, CityName, PreferredTime } from '../types';
import { deduplicateSchedules } from '../data/mockData';

interface BusSearchScreenProps {
  searchParams: SearchParams;
  schedules: TripSchedule[];
  cities: CityName[];
  onSelectTrip: (trip: TripSchedule) => void;
  onUpdateSearchParams: (newParams: SearchParams) => void;
  onBack: () => void;
}

export const BusSearchScreen: React.FC<BusSearchScreenProps> = ({
  searchParams,
  schedules,
  cities,
  onSelectTrip,
  onUpdateSearchParams,
  onBack,
}) => {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<PreferredTime>(
    searchParams.preferredTime || 'Any Time'
  );
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'time_asc' | 'seats_desc'>('price_asc');
  const [selectedBusType, setSelectedBusType] = useState<string>('All');
  const [showEditSearchModal, setShowEditSearchModal] = useState<boolean>(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<TripSchedule | null>(null);

  // Edit search states
  const [editFrom, setEditFrom] = useState<CityName>(searchParams.fromCity);
  const [editTo, setEditTo] = useState<CityName>(searchParams.toCity);
  const [editDate, setEditDate] = useState<string>(searchParams.travelDate);
  const [editPassengers, setEditPassengers] = useState<number>(searchParams.passengerCount || 1);

  // Derive dynamic bus types available for the current route and date
  const availableBusTypes = useMemo(() => {
    const routeDateTrips = schedules.filter((trip) => {
      const fromMatch =
        !searchParams.fromCity ||
        trip.fromCity.toLowerCase().trim() === searchParams.fromCity.toLowerCase().trim();
      const toMatch =
        !searchParams.toCity ||
        trip.toCity.toLowerCase().trim() === searchParams.toCity.toLowerCase().trim();
      const dateMatch =
        !searchParams.travelDate || !trip.travelDate || trip.travelDate === searchParams.travelDate;
      return fromMatch && toMatch && dateMatch;
    });

    const uniqueTypes = Array.from(
      new Set(routeDateTrips.map((t) => t.busType).filter(Boolean))
    );
    return ['All', ...uniqueTypes];
  }, [schedules, searchParams.fromCity, searchParams.toCity, searchParams.travelDate]);

  // Filter schedules strictly by travel date, route, time slot, and bus type
  const filteredSchedules = useMemo(() => {
    return schedules.filter((trip) => {
      // Case-insensitive match on origin and destination
      const fromMatch =
        !searchParams.fromCity ||
        trip.fromCity.toLowerCase().trim() === searchParams.fromCity.toLowerCase().trim();
      const toMatch =
        !searchParams.toCity ||
        trip.toCity.toLowerCase().trim() === searchParams.toCity.toLowerCase().trim();

      if (!fromMatch || !toMatch) return false;

      // Filter strictly by travel date
      if (searchParams.travelDate && trip.travelDate && trip.travelDate !== searchParams.travelDate) {
        return false;
      }

      // Filter by preferred time
      if (selectedTimeFilter !== 'Any Time') {
        const hour = parseInt(trip.departureTime.split(':')[0], 10);
        const isPM = trip.departureTime.includes('PM');
        const hour24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;

        if (selectedTimeFilter === 'Morning' && (hour24 < 5 || hour24 >= 12)) return false;
        if (selectedTimeFilter === 'Afternoon' && (hour24 < 12 || hour24 >= 17)) return false;
        if (selectedTimeFilter === 'Evening' && (hour24 < 17 || hour24 >= 21)) return false;
        if (selectedTimeFilter === 'Night' && hour24 < 21 && hour24 >= 5) return false;
      }

      // Filter by bus type
      if (selectedBusType !== 'All' && trip.busType !== selectedBusType) {
        return false;
      }

      return true;
    });
  }, [schedules, searchParams.fromCity, searchParams.toCity, searchParams.travelDate, selectedTimeFilter, selectedBusType]);

  // Sort trips (Seats Available sorts from most to least)
  const sortedTrips = useMemo(() => {
    const list = [...filteredSchedules];
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.priceMMK - b.priceMMK);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.priceMMK - a.priceMMK);
    } else if (sortBy === 'seats_desc') {
      list.sort((a, b) => (24 - b.bookedSeats.length) - (24 - a.bookedSeats.length));
    }
    return list;
  }, [filteredSchedules, sortBy]);

  const handleApplySearchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSearchParams({
      fromCity: editFrom,
      toCity: editTo,
      travelDate: editDate,
      preferredTime: selectedTimeFilter,
      passengerCount: editPassengers,
    });
    setShowEditSearchModal(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 pb-28 md:pb-12 space-y-6 animate-fade-in font-sans">
      {/* Top Search Context Bar */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-4 md:p-5 shadow-xs border border-surface-container-high dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-full text-primary dark:text-white hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Back"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-base md:text-xl font-bold text-primary dark:text-white flex items-center gap-2">
            <span>{searchParams.fromCity}</span>
            <span className="material-symbols-outlined text-base text-secondary dark:text-teal-300">
              arrow_forward
            </span>
            <span>{searchParams.toCity}</span>
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-400 mt-0.5">
            {formatDateDisplay(searchParams.travelDate)} • {searchParams.passengerCount || 1} {(searchParams.passengerCount || 1) === 1 ? 'Passenger' : 'Passengers'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditFrom(searchParams.fromCity);
            setEditTo(searchParams.toCity);
            setEditDate(searchParams.travelDate);
            setEditPassengers(searchParams.passengerCount || 1);
            setShowEditSearchModal(true);
          }}
          className="p-2 -mr-1 rounded-full text-secondary dark:text-teal-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Edit Search"
        >
          <span className="material-symbols-outlined text-xl">edit</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-4 md:p-5 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-teal-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">tune</span>
            Filters & Sorting
          </span>
          <button
            onClick={() => {
              setSelectedBusType('All');
              setSortBy('price_asc');
              setSelectedTimeFilter('Any Time');
            }}
            className="text-xs text-secondary dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
          >
            Reset All
          </button>
        </div>

        {/* Bus Type Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-on-surface-variant dark:text-slate-400 font-semibold whitespace-nowrap">
            Bus Type:
          </span>
          {availableBusTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedBusType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedBusType === type
                  ? 'bg-secondary text-white font-bold shadow-2xs'
                  : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container'
              }`}
            >
              {type === 'All' ? 'All Bus Types' : type}
            </button>
          ))}
        </div>

        {/* Sorting Options */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-outline-variant/30 dark:border-slate-800">
          <span className="text-xs text-on-surface-variant dark:text-slate-400 font-semibold whitespace-nowrap">
            Sort By:
          </span>
          {[
            { id: 'price_asc', label: 'Price: Low to High' },
            { id: 'price_desc', label: 'Price: High to Low' },
            { id: 'seats_desc', label: 'Seats Available' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                sortBy === s.id
                  ? 'bg-secondary-container dark:bg-teal-950 text-on-secondary-container dark:text-teal-300 font-bold'
                  : 'text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white bg-surface-container-low/50 dark:bg-slate-800/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Available Buses Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm md:text-base font-bold text-primary dark:text-white">
          Available Buses ({sortedTrips.length})
        </h2>
        <span className="text-xs text-on-surface-variant dark:text-slate-400">
          All fares include taxes & fees
        </span>
      </div>

      {/* Trip List */}
      {sortedTrips.length === 0 ? (
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-10 text-center border border-surface-container-high dark:border-slate-800 space-y-3">
          <span className="material-symbols-outlined text-5xl text-outline dark:text-slate-500">
            directions_bus
          </span>
          <h3 className="text-base font-bold text-primary dark:text-white">
            No Buses Found
          </h3>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-md mx-auto">
            No active schedules matched your criteria. Try adjusting the departure time or bus type filters.
          </p>
          <button
            onClick={() => {
              setSelectedBusType('All');
              setSelectedTimeFilter('Any Time');
            }}
            className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-[#00504c] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTrips.map((trip) => {
            const seatsLeft = 24 - trip.bookedSeats.length;
            const isLowSeats = seatsLeft <= 5 && seatsLeft > 0;
            const isSoldOut = seatsLeft === 0;

            return (
              <div
                key={trip.id}
                className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-surface-container-high dark:border-slate-800 hover:shadow-md hover:border-secondary/40 transition-all duration-200"
              >
                {/* Top Row: Operator, Bus Type & Price */}
                <div className="flex flex-wrap justify-between items-start gap-2 mb-4 pb-3 border-b border-outline-variant/30 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-secondary-container/40 dark:bg-teal-950/60 text-secondary dark:text-teal-300 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-2xl">directions_bus</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-primary dark:text-white">
                          {trip.busName}
                        </h3>
                        <span className="text-[10px] font-semibold text-secondary dark:text-teal-300 bg-secondary-container/40 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                          {formatDateDisplay(trip.travelDate)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
                        {trip.busType} • <span className="font-mono">{trip.busCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg md:text-xl font-bold text-primary dark:text-white">
                      {trip.priceMMK.toLocaleString()} MMK
                    </p>
                    <span className="text-[11px] text-on-surface-variant dark:text-slate-400 font-medium">
                      per seat
                    </span>
                  </div>
                </div>

                {/* Middle Row: Times, Duration, Stations */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-4">
                  {/* Departure & Arrival visual */}
                  <div className="md:col-span-8 flex items-center justify-between">
                    <div>
                      <p className="text-base md:text-lg font-bold text-primary dark:text-white">
                        {trip.departureTime}
                      </p>
                      <p className="text-xs font-semibold text-on-surface-variant dark:text-slate-300">
                        {trip.fromCity}
                      </p>
                      <p className="text-[10px] text-outline dark:text-slate-500">
                        {trip.fromTerminal}
                      </p>
                    </div>

                    <div className="flex flex-col items-center px-3 flex-1">
                      <span className="text-[11px] font-medium text-on-surface-variant dark:text-slate-400 mb-1">
                        {trip.durationText}
                      </span>
                      <div className="w-full flex items-center">
                        <div className="w-2 h-2 rounded-full border-2 border-secondary bg-surface"></div>
                        <div className="flex-1 h-[1.5px] bg-outline-variant dark:bg-slate-700"></div>
                        <span className="material-symbols-outlined text-xs text-secondary mx-0.5">
                          directions_bus
                        </span>
                        <div className="flex-1 h-[1.5px] bg-outline-variant dark:bg-slate-700"></div>
                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                      </div>
                      <span className="text-[10px] text-secondary font-bold mt-1">
                        Direct Express
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-base md:text-lg font-bold text-primary dark:text-white">
                        {trip.arrivalTime}
                      </p>
                      <p className="text-xs font-semibold text-on-surface-variant dark:text-slate-300">
                        {trip.toCity}
                      </p>
                      <p className="text-[10px] text-outline dark:text-slate-500">
                        {trip.toTerminal}
                      </p>
                    </div>
                  </div>

                  {/* Seat Availability Badge & Action Button */}
                  <div className="md:col-span-4 flex md:flex-col items-center md:items-end justify-between gap-2">
                    <div>
                      {isSoldOut ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-error bg-error-container/40 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Sold Out
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            isLowSeats
                              ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60'
                              : 'text-secondary dark:text-teal-300 bg-secondary-container/40 dark:bg-teal-950/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLowSeats ? 'bg-amber-500 animate-pulse' : 'bg-secondary dark:bg-teal-400'
                            }`}
                          ></span>
                          {seatsLeft} Seats Left
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => onSelectTrip(trip)}
                      className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        isSoldOut
                          ? 'bg-surface-container-high dark:bg-slate-800 text-outline cursor-not-allowed'
                          : 'bg-secondary hover:bg-[#00504c] text-white active:scale-95'
                      }`}
                    >
                      <span>Select Seats</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Amenities and Details trigger */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-outline-variant/20 dark:border-slate-800/80">
                  <div className="flex items-center gap-3 text-on-surface-variant dark:text-slate-400 overflow-x-auto no-scrollbar">
                    {trip.amenities.map((amenity, idx) => (
                      <span key={idx} className="flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-sm text-secondary">
                          check_circle
                        </span>
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTripDetails(trip)}
                    className="text-xs text-secondary dark:text-cyan-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                  >
                    <span>View Trip Details</span>
                    <span className="material-symbols-outlined text-xs">info</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedTripDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-outline-variant dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30 dark:border-slate-800">
              <h3 className="font-bold text-base text-primary dark:text-white">
                Trip Details
              </h3>
              <button
                onClick={() => setSelectedTripDetails(null)}
                className="p-1 text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-surface-container-low dark:bg-slate-800 p-3.5 rounded-xl">
                <p className="font-bold text-sm text-primary dark:text-white mb-1">
                  {selectedTripDetails.busName} ({selectedTripDetails.busCode})
                </p>
                <p className="text-on-surface-variant dark:text-slate-400">
                  {selectedTripDetails.busType} • 24 Seats Total
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-low dark:bg-slate-800 rounded-xl">
                  <p className="text-on-surface-variant dark:text-slate-400 text-[11px]">Boarding Station</p>
                  <p className="font-bold text-primary dark:text-white mt-0.5">{selectedTripDetails.fromTerminal}</p>
                  <p className="text-secondary font-semibold mt-1">{selectedTripDetails.departureTime}</p>
                </div>
                <div className="p-3 bg-surface-container-low dark:bg-slate-800 rounded-xl">
                  <p className="text-on-surface-variant dark:text-slate-400 text-[11px]">Drop-off Station</p>
                  <p className="font-bold text-primary dark:text-white mt-0.5">{selectedTripDetails.toTerminal}</p>
                  <p className="text-secondary font-semibold mt-1">{selectedTripDetails.arrivalTime}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-primary dark:text-white mb-1.5">Onboard Amenities</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedTripDetails.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-on-surface-variant dark:text-slate-300">
                      <span className="material-symbols-outlined text-secondary text-sm">check</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800">
                <p className="font-bold text-primary dark:text-white mb-1">Baggage & Travel Policy</p>
                <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                  Each ticket includes up to 20kg of standard checked luggage and 1 carry-on item. Please arrive 30 minutes before scheduled departure time.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const tripToSelect = selectedTripDetails;
                setSelectedTripDetails(null);
                onSelectTrip(tripToSelect);
              }}
              className="w-full py-3 bg-secondary hover:bg-[#00504c] text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Proceed to Seat Selection
            </button>
          </div>
        </div>
      )}

      {/* Edit Search Modal */}
      {showEditSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30 dark:border-slate-800">
              <h3 className="font-bold text-base text-primary dark:text-white">
                Modify Search
              </h3>
              <button
                onClick={() => setShowEditSearchModal(false)}
                className="p-1 text-on-surface-variant hover:text-primary dark:hover:text-white rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleApplySearchEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  From (Departure)
                </label>
                <select
                  value={editFrom}
                  onChange={(e) => setEditFrom(e.target.value as CityName)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant rounded-xl text-primary dark:text-white cursor-pointer"
                >
                  {cities.map((c) => (
                    <option key={`ef-${c}`} value={c} disabled={c === editTo}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  To (Destination)
                </label>
                <select
                  value={editTo}
                  onChange={(e) => setEditTo(e.target.value as CityName)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant rounded-xl text-primary dark:text-white cursor-pointer"
                >
                  {cities.map((c) => (
                    <option key={`et-${c}`} value={c} disabled={c === editFrom}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant rounded-xl text-primary dark:text-white cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditSearchModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant font-semibold text-on-surface dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-secondary text-white font-bold shadow-xs cursor-pointer hover:bg-[#00504c]"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
