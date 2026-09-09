import React, { useState } from 'react';
import { CityName, PreferredTime, SearchParams, Bus, User, Booking } from '../types';

interface HomeScreenProps {
  onSearch: (params: SearchParams) => void;
  buses: Bus[];
  cities: CityName[];
  currentUser: User | null;
  onNavigateToBookings: () => void;
  onNavigateToTimetables: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToTicket: (bookingId: string) => void;
  recentBookings: Booking[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSearch,
  buses,
  cities,
  currentUser,
  onNavigateToBookings,
  onNavigateToTimetables,
  onNavigateToHelp,
  onNavigateToTicket,
  recentBookings,
}) => {
  const trimmedName = currentUser?.name?.trim();
  const greeting = trimmedName ? `Hello, ${trimmedName}` : 'Hello';

  const todayStr = new Date().toISOString().split('T')[0];
  const [fromCity, setFromCity] = useState<CityName | ''>('');
  const [toCity, setToCity] = useState<CityName | ''>('');
  const [travelDate, setTravelDate] = useState<string>(todayStr);
  const [preferredTime, setPreferredTime] = useState<PreferredTime>('Any Time');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSwapCities = () => {
    setErrorMessage('');
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fromCity || !toCity) {
      setErrorMessage('Please select both departure and destination cities.');
      return;
    }

    if (fromCity === toCity) {
      setErrorMessage('Departure and destination cities cannot be the same.');
      return;
    }

    onSearch({
      fromCity,
      toCity,
      travelDate: travelDate || todayStr,
      preferredTime,
      passengerCount,
    });
  };

  const handleQuickRouteSelect = (from: CityName, to: CityName) => {
    setErrorMessage('');
    setFromCity(from);
    setToCity(to);
    onSearch({
      fromCity: from,
      toCity: to,
      travelDate: travelDate || todayStr,
      preferredTime: 'Any Time',
      passengerCount: 1,
    });
  };

  // Find next upcoming booking for banner
  const upcomingBooking = recentBookings.find((b) => b.status === 'Upcoming');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-12 space-y-8 animate-fade-in font-sans">
      {/* Top Header & Upcoming Booking Alert */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xl md:text-2xl font-bold text-secondary dark:text-teal-400 tracking-tight">
            {greeting}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white tracking-tight mt-1">
            Where do you want to go?
          </h1>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1.5">
            Find your next trip in just a few taps.
          </p>
        </div>

        {/* Status Pill for Active Tickets */}
        {upcomingBooking && (
          <div
            onClick={() => onNavigateToTicket(upcomingBooking.id)}
            className="cursor-pointer self-start md:self-auto bg-secondary-container/40 dark:bg-slate-800 border border-secondary/30 dark:border-teal-500/30 rounded-xl p-3 flex items-center gap-3 hover:bg-secondary-container/60 transition-all shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary dark:text-white">
                  {upcomingBooking.fromCity} → {upcomingBooking.toCity}
                </span>
                <span className="text-[10px] bg-secondary text-white font-bold px-1.5 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>
              <p className="text-xs text-on-surface-variant dark:text-slate-300">
                Seat {upcomingBooking.seatNumbers.join(', ')} • {upcomingBooking.departureTime}
              </p>
            </div>
            <span className="material-symbols-outlined text-secondary dark:text-teal-300 ml-1 text-sm">
              arrow_forward
            </span>
          </div>
        )}
      </section>

      {/* Main Search Card */}
      <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-[0px_4px_25px_rgba(26,43,72,0.06)] p-5 md:p-7 border border-surface-container-high dark:border-slate-800 relative z-10 overflow-hidden">
        {errorMessage && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
            {/* Origin City */}
            <div className="md:col-span-4 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mb-1.5">
                From (Departure)
              </label>
              <div className="flex items-center bg-surface-container-low dark:bg-slate-800 rounded-xl px-3.5 py-2.5 border border-outline-variant/60 dark:border-slate-700 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                <span className="material-symbols-outlined text-outline dark:text-slate-400 mr-2.5 text-xl">
                  location_on
                </span>
                <select
                  value={fromCity}
                  onChange={(e) => {
                    setErrorMessage('');
                    setFromCity(e.target.value as CityName);
                  }}
                  className={`w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none cursor-pointer ${
                    fromCity ? 'text-on-surface dark:text-white' : 'text-outline dark:text-slate-400'
                  }`}
                >
                  <option value="" disabled className="text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800">
                    Select Departure City
                  </option>
                  {cities.map((city) => (
                    <option
                      key={`from-${city}`}
                      value={city}
                      disabled={city === toCity}
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800"
                    >
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center -my-2 md:my-0 md:pt-6">
              <button
                type="button"
                onClick={handleSwapCities}
                className="w-9 h-9 rounded-full bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 text-on-surface-variant dark:text-slate-300 hover:text-secondary dark:hover:text-cyan-400 hover:scale-110 active:scale-95 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                title="Swap Cities"
              >
                <span className="material-symbols-outlined text-lg">swap_horiz</span>
              </button>
            </div>

            {/* Destination City */}
            <div className="md:col-span-4 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mb-1.5">
                To (Destination)
              </label>
              <div className="flex items-center bg-surface-container-low dark:bg-slate-800 rounded-xl px-3.5 py-2.5 border border-outline-variant/60 dark:border-slate-700 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                <span className="material-symbols-outlined text-outline dark:text-slate-400 mr-2.5 text-xl">
                  location_city
                </span>
                <select
                  value={toCity}
                  onChange={(e) => {
                    setErrorMessage('');
                    setToCity(e.target.value as CityName);
                  }}
                  className={`w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none cursor-pointer ${
                    toCity ? 'text-on-surface dark:text-white' : 'text-outline dark:text-slate-400'
                  }`}
                >
                  <option value="" disabled className="text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800">
                    Select Destination City
                  </option>
                  {cities.map((city) => (
                    <option
                      key={`to-${city}`}
                      value={city}
                      disabled={city === fromCity}
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800"
                    >
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Date */}
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mb-1.5">
                Travel Date
              </label>
              <div className="flex items-center bg-surface-container-low dark:bg-slate-800 rounded-xl px-3.5 py-2.5 border border-outline-variant/60 dark:border-slate-700 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                <span className="material-symbols-outlined text-outline dark:text-slate-400 mr-2.5 text-xl">
                  calendar_today
                </span>
                <input
                  type="date"
                  value={travelDate}
                  min={todayStr}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface dark:text-white focus:ring-0 outline-none cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* Preferred Time Filter & Passenger count */}
          <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs text-on-surface-variant dark:text-slate-400 font-semibold whitespace-nowrap">
                Preferred Time:
              </span>
              {(['Any Time', 'Morning', 'Afternoon', 'Evening', 'Night'] as PreferredTime[]).map(
                (timeOpt) => {
                  return (
                    <button
                      key={timeOpt}
                      type="button"
                      onClick={() => setPreferredTime(timeOpt)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        preferredTime === timeOpt
                          ? 'bg-secondary dark:bg-teal-600 text-white font-bold shadow-xs'
                          : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700 border border-outline-variant/40 dark:border-slate-700'
                      }`}
                    >
                      {timeOpt}
                    </button>
                  );
                }
              )}
            </div>

            {/* Passenger Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant dark:text-slate-400 font-semibold">
                Passengers: <span className="text-secondary dark:text-teal-300 font-bold">{passengerCount} {passengerCount === 1 ? 'Person' : 'Persons'}</span>
              </span>
              <div className="flex items-center bg-surface-container-low dark:bg-slate-800 rounded-lg p-0.5 border border-outline-variant/40 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-white cursor-pointer"
                  title="Decrease passengers"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold text-primary dark:text-white min-w-[20px] text-center">
                  {passengerCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengerCount(Math.min(6, passengerCount + 1))}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-white cursor-pointer"
                  title="Increase passengers"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Search Action Button */}
          <button
            type="submit"
            className="w-full bg-secondary hover:bg-[#00504c] text-white text-sm md:text-base font-bold rounded-xl py-3.5 mt-2 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
            <span>Find Buses</span>
          </button>
        </form>
      </section>

      {/* Popular Routes Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-primary dark:text-white tracking-tight">
              Popular Routes
            </h2>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">
              Frequently booked direct journeys across Myanmar
            </p>
          </div>
          <button
            onClick={() => handleQuickRouteSelect('Yangon', 'Mandalay')}
            className="text-xs text-secondary dark:text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            View All Routes
          </button>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {/* Card 1: Yangon to Mandalay */}
          <div
            onClick={() => handleQuickRouteSelect('Yangon', 'Mandalay')}
            className="min-w-[240px] md:min-w-[270px] bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-xs border border-surface-container-low dark:border-slate-800 overflow-hidden shrink-0 flex flex-col group cursor-pointer hover:-translate-y-1 transition-all duration-300 snap-start"
          >
            <div className="h-32 bg-slate-800 relative overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOgRlDMM_vVWV5QvMzyejseQzVZaBOdL5BIgkTJNhIC1MjjD1V8PVBcXaG090-qgx8sXEEqPWo7sOOptmaKeZW1WCBWLRdW6QKUEtFnaLD_T4vFyjdgw26sSouPBugp4JFStLvhnEycQbhIb8RpCJMNi6t7oCTP1MCT-vZq5LRtIYMU4JIxanF9TiOLiscPT-qM7nsIvnwcNmt0jpCKXug4U8jhXCuyX9GHkxcWBL0R1TAJBcc8CJMJQ"
                alt="Yangon to Mandalay"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-white">
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">Direct Express</p>
                <p className="text-sm font-bold flex items-center gap-1">
                  Yangon <span className="material-symbols-outlined text-[14px]">arrow_forward</span> Mandalay
                </p>
              </div>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <div className="text-on-surface-variant dark:text-slate-400 text-xs font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> 8h 30m
              </div>
              <div className="text-primary dark:text-teal-300 font-bold text-sm">
                35,000 MMK
              </div>
            </div>
          </div>

          {/* Card 2: Yangon to Taunggyi */}
          <div
            onClick={() => handleQuickRouteSelect('Yangon', 'Taunggyi')}
            className="min-w-[240px] md:min-w-[270px] bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-xs border border-surface-container-low dark:border-slate-800 overflow-hidden shrink-0 flex flex-col group cursor-pointer hover:-translate-y-1 transition-all duration-300 snap-start"
          >
            <div className="h-32 bg-slate-800 relative overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuFamjCkr9QvwJUiZc6e3BaAt-Ttaz-LZLvLKE9MIKGr2qLAfUUL_S3TSepXcFDAQ9yVl8HK-zurLS-fNhYnqx-lG1ukPG-i_exKhOSE3opr6FWcGK-tGJCn6v7hlMpBehN_mfcxpJn2FqicHCBTLZl4ilGomcwH9Suj_5lijGLL9A4_Y-L2KxiAscp1RbVuek8PKN2ajg63qOLY0QasNz78291pWa8Tj285Lofy8uWrFphhnr4jO0MA"
                alt="Yangon to Taunggyi"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-white">
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">VIP Express</p>
                <p className="text-sm font-bold flex items-center gap-1">
                  Yangon <span className="material-symbols-outlined text-[14px]">arrow_forward</span> Taunggyi
                </p>
              </div>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <div className="text-on-surface-variant dark:text-slate-400 text-xs font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> 11h 00m
              </div>
              <div className="text-primary dark:text-teal-300 font-bold text-sm">
                42,000 MMK
              </div>
            </div>
          </div>

          {/* Card 3: Yangon to Bago */}
          <div
            onClick={() => handleQuickRouteSelect('Yangon', 'Bago')}
            className="min-w-[240px] md:min-w-[270px] bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-xs border border-surface-container-low dark:border-slate-800 overflow-hidden shrink-0 flex flex-col group cursor-pointer hover:-translate-y-1 transition-all duration-300 snap-start"
          >
            <div className="h-32 bg-slate-800 relative overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-teal-900 to-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-teal-400/40">directions_bus</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-white">
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">Express</p>
                <p className="text-sm font-bold flex items-center gap-1">
                  Yangon <span className="material-symbols-outlined text-[14px]">arrow_forward</span> Bago
                </p>
              </div>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <div className="text-on-surface-variant dark:text-slate-400 text-xs font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> 2h 00m
              </div>
              <div className="text-primary dark:text-teal-300 font-bold text-sm">
                12,000 MMK
              </div>
            </div>
          </div>

          {/* Card 4: Yangon to Myeik */}
          <div
            onClick={() => handleQuickRouteSelect('Yangon', 'Myeik')}
            className="min-w-[240px] md:min-w-[270px] bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-xs border border-surface-container-low dark:border-slate-800 overflow-hidden shrink-0 flex flex-col group cursor-pointer hover:-translate-y-1 transition-all duration-300 snap-start"
          >
            <div className="h-32 bg-slate-800 relative overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-cyan-950 to-blue-900 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-cyan-400/40">directions_bus</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-2.5 left-3 text-white">
                <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">Direct Express</p>
                <p className="text-sm font-bold flex items-center gap-1">
                  Yangon <span className="material-symbols-outlined text-[14px]">arrow_forward</span> Myeik
                </p>
              </div>
            </div>
            <div className="p-3.5 flex justify-between items-center">
              <div className="text-on-surface-variant dark:text-slate-400 text-xs font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> 16h 00m
              </div>
              <div className="text-primary dark:text-teal-300 font-bold text-sm">
                48,000 MMK
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Buses Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-primary dark:text-white tracking-tight">
              Featured Bus Operators
            </h2>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">
              Top rated express bus lines with premium amenities
            </p>
          </div>
          <button
            onClick={() => handleFormSubmit({ preventDefault: () => {} } as any)}
            className="text-xs text-secondary dark:text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buses.slice(0, 4).map((bus, idx) => (
            <div
              key={bus.id}
              onClick={() => handleFormSubmit({ preventDefault: () => {} } as any)}
              className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-2xs border border-surface-container-low dark:border-slate-800 p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-surface-container-low dark:bg-slate-800 flex items-center justify-center shrink-0 border border-outline-variant/40 dark:border-slate-700 group-hover:border-secondary transition-colors">
                <span
                  className={`material-symbols-outlined text-3xl md:text-4xl ${
                    idx % 2 === 0 ? 'text-secondary dark:text-teal-400' : 'text-primary dark:text-blue-300'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  directions_bus
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm md:text-base font-bold text-primary dark:text-white group-hover:text-secondary transition-colors">
                    {bus.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-secondary-container/30 dark:bg-teal-950/60 text-secondary dark:text-teal-300 px-2 py-0.5 rounded text-xs font-bold">
                    <span
                      className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    {bus.rating.toFixed(1)}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 line-clamp-1 mb-2">
                  {bus.amenities.slice(0, 3).join(' • ')}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline dark:text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">event_seat</span>
                    24 Seats
                  </span>
                  <span className="text-secondary dark:text-cyan-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Book Now <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Access Bar */}
      <section className="bg-surface-container-low dark:bg-slate-900/60 rounded-xl p-4 border border-outline-variant/30 dark:border-slate-800 grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={onNavigateToBookings}
          className="flex items-center gap-3 p-3 bg-surface-container-lowest dark:bg-slate-800 rounded-lg hover:border-secondary border border-transparent transition-all text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-secondary text-2xl">confirmation_number</span>
          <div>
            <p className="text-xs font-bold text-primary dark:text-white">My Bookings</p>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400">View & Manage</p>
          </div>
        </button>

        <button
          onClick={onNavigateToTimetables}
          className="flex items-center gap-3 p-3 bg-surface-container-lowest dark:bg-slate-800 rounded-lg hover:border-secondary border border-transparent transition-all text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-secondary text-2xl">schedule</span>
          <div>
            <p className="text-xs font-bold text-primary dark:text-white">Bus Timetables</p>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400">Daily Departure Times</p>
          </div>
        </button>

        <button
          onClick={onNavigateToHelp}
          className="col-span-2 md:col-span-1 flex items-center gap-3 p-3 bg-surface-container-lowest dark:bg-slate-800 rounded-lg hover:border-secondary border border-transparent transition-all text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-secondary text-2xl">support_agent</span>
          <div>
            <p className="text-xs font-bold text-primary dark:text-white">Help Center</p>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400">24/7 Helpline • +95 9 789 000 123</p>
          </div>
        </button>
      </section>
    </div>
  );
};
