import React, { useState, useEffect } from 'react';
import { Bus, RouteItem, TripSchedule, Booking, User, CityName } from '../types';
import { UserAvatar } from './UserAvatar';

interface AdminDashboardProps {
  buses: Bus[];
  routes: RouteItem[];
  schedules: TripSchedule[];
  bookings: Booking[];
  users: User[];
  cities: CityName[];
  onAddBus: (bus: Omit<Bus, 'id'>) => void;
  onUpdateBus: (bus: Bus) => void;
  onDeleteBus: (id: string) => void;
  onAddSchedule: (schedule: Omit<TripSchedule, 'id'>) => void;
  onUpdateSchedule: (schedule: TripSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onUpdateBookingStatus: (id: string, status: Booking['status']) => void;
  onAddCity: (city: string) => void;
  onReturnToPassengerApp: () => void;
  onAdminLogout?: () => void;
  onRefreshUsers?: () => Promise<void>;
  onUpdateUserStatus?: (userId: string, status: 'Active' | 'Suspended' | 'Inactive') => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  buses,
  routes,
  schedules,
  bookings,
  users,
  cities,
  onAddBus,
  onUpdateBus,
  onDeleteBus,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onUpdateBookingStatus,
  onAddCity,
  onReturnToPassengerApp,
  onAdminLogout,
  onRefreshUsers,
  onUpdateUserStatus,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'buses' | 'schedules' | 'bookings' | 'cities' | 'users'
  >('overview');

  // Form Modals
  const [busModalOpen, setBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TripSchedule | null>(null);

  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'passenger' | 'admin'>('all');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Auto-refresh users when switching to the Users tab
  useEffect(() => {
    if (activeTab === 'users' && onRefreshUsers) {
      setIsRefreshingUsers(true);
      onRefreshUsers().finally(() => {
        setIsRefreshingUsers(false);
      });
    }
  }, [activeTab, onRefreshUsers]);

  const handleManualRefreshUsers = async () => {
    if (!onRefreshUsers) return;
    setIsRefreshingUsers(true);
    try {
      await onRefreshUsers();
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const handleCopyUserId = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedUserId(id);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  // Bus form state
  const [busName, setBusName] = useState('');
  const [busCode, setBusCode] = useState('');
  const [busPlate, setBusPlate] = useState('');
  const [busType, setBusType] = useState<Bus['type']>('VIP Seating');
  const [busAmenities, setBusAmenities] = useState<string>('Air Conditioning, Wi-Fi, Water Bottle');
  const [busStatus, setBusStatus] = useState<Bus['status']>('Active');

  // Schedule form state
  const [schBusId, setSchBusId] = useState(buses[0]?.id || '');
  const [schFrom, setSchFrom] = useState<CityName>('Yangon');
  const [schTo, setSchTo] = useState<CityName>('Mandalay');
  const [schFromTerm, setSchFromTerm] = useState('Aung Mingalar Highway Station');
  const [schToTerm, setSchToTerm] = useState('Chan Mya Shwe Pyi Highway Station');
  const [schDepTime, setSchDepTime] = useState('08:00 PM');
  const [schArrTime, setSchArrTime] = useState('05:00 AM');
  const [schDuration, setSchDuration] = useState('9h 00m');
  const [schPrice, setSchPrice] = useState('35000');
  const [schDate, setSchDate] = useState(new Date().toISOString().split('T')[0]);

  // Metrics Calculations
  const totalRevenue = bookings.reduce((sum, b) => (b.status !== 'Cancelled' ? sum + b.totalPriceMMK : sum), 0);
  const activeBusesCount = buses.filter((b) => b.status === 'Active').length;
  const todayBookingsCount = bookings.length;

  const handleOpenAddBus = () => {
    setEditingBus(null);
    setBusName('');
    setBusCode(`RX-${Math.floor(100 + Math.random() * 900)}`);
    setBusPlate('YGN-7B-8921');
    setBusType('VIP Seating');
    setBusAmenities('Air Conditioning, Wi-Fi, Reclining Seats, USB Charging');
    setBusStatus('Active');
    setBusModalOpen(true);
  };

  const handleOpenEditBus = (bus: Bus) => {
    setEditingBus(bus);
    setBusName(bus.name);
    setBusCode(bus.code);
    setBusPlate(bus.plateNumber);
    setBusType(bus.type);
    setBusAmenities(bus.amenities.join(', '));
    setBusStatus(bus.status);
    setBusModalOpen(true);
  };

  const handleSaveBus = (e: React.FormEvent) => {
    e.preventDefault();
    const amenitiesArr = busAmenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    if (editingBus) {
      onUpdateBus({
        ...editingBus,
        name: busName,
        code: busCode,
        plateNumber: busPlate,
        type: busType,
        amenities: amenitiesArr,
        status: busStatus,
      });
    } else {
      onAddBus({
        name: busName,
        code: busCode,
        plateNumber: busPlate,
        type: busType,
        totalSeats: 24,
        amenities: amenitiesArr,
        status: busStatus,
      });
    }
    setBusModalOpen(false);
  };

  const handleOpenAddSchedule = () => {
    setEditingSchedule(null);
    setSchBusId(buses[0]?.id || '');
    setSchFrom('Yangon');
    setSchTo('Mandalay');
    setSchFromTerm('Aung Mingalar Highway Bus Station');
    setSchToTerm('Chan Mya Shwe Pyi Highway Station');
    setSchDepTime('08:00 PM');
    setSchArrTime('05:00 AM');
    setSchDuration('9h 00m');
    setSchPrice('35000');
    setSchDate(new Date().toISOString().split('T')[0]);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const selBus = buses.find((b) => b.id === schBusId) || buses[0];

    if (editingSchedule) {
      onUpdateSchedule({
        ...editingSchedule,
        busId: selBus.id,
        busName: selBus.name,
        busCode: selBus.code,
        busType: selBus.type,
        fromCity: schFrom,
        toCity: schTo,
        fromTerminal: schFromTerm,
        toTerminal: schToTerm,
        departureTime: schDepTime,
        arrivalTime: schArrTime,
        durationText: schDuration,
        priceMMK: parseInt(schPrice, 10) || 35000,
        travelDate: schDate,
      });
    } else {
      onAddSchedule({
        busId: selBus.id,
        busName: selBus.name,
        busCode: selBus.code,
        busType: selBus.type,
        fromCity: schFrom,
        toCity: schTo,
        fromTerminal: schFromTerm,
        toTerminal: schToTerm,
        departureTime: schDepTime,
        arrivalTime: schArrTime,
        durationText: schDuration,
        priceMMK: parseInt(schPrice, 10) || 35000,
        travelDate: schDate,
        bookedSeats: [],
        amenities: selBus.amenities,
      });
    }
    setScheduleModalOpen(false);
  };

  const handleAddCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCityName.trim()) {
      onAddCity(newCityName.trim());
      setNewCityName('');
      setCityModalOpen(false);
    }
  };

  const formatMMK = (amount: number) => {
    return `${amount.toLocaleString()} MMK`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 pb-28 md:pb-12 space-y-6 font-sans animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-surface-container-high dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary-container text-on-primary-container text-xs font-mono font-bold px-2.5 py-0.5 rounded">
              Console
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-primary dark:text-white">
              Admin & Fleet Management
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            Real-time control center for fleet assets, trip schedules, and live passenger reservations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onReturnToPassengerApp}
            className="px-3.5 py-2 bg-secondary hover:bg-[#00504c] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            title="Exit Admin Mode and return to Passenger app"
          >
            <span className="material-symbols-outlined text-sm">directions_bus</span>
            <span>Switch to Passenger Mode</span>
          </button>
          <button
            onClick={onAdminLogout || onReturnToPassengerApp}
            className="px-3.5 py-2 bg-error-container hover:bg-error-container/80 text-on-error-container text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            title="Log out of Admin Session"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Admin Logout</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-4 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="material-symbols-outlined text-2xl">payments</span>
            <span className="text-[11px] font-bold text-secondary dark:text-teal-300 bg-secondary-container/40 px-2 py-0.5 rounded">
              +14%
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400">Total Revenue</p>
          <h3 className="text-lg md:text-xl font-bold text-primary dark:text-teal-300 mt-0.5">
            {formatMMK(totalRevenue)}
          </h3>
        </div>

        {/* Active Buses */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-4 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="material-symbols-outlined text-2xl">directions_bus</span>
            <span className="text-[11px] font-bold text-secondary dark:text-teal-300 bg-secondary-container/40 px-2 py-0.5 rounded">
              24-Seats
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400">Fleet Units</p>
          <h3 className="text-lg md:text-xl font-bold text-primary dark:text-white mt-0.5">
            {activeBusesCount} / {buses.length} Active
          </h3>
        </div>

        {/* Today Bookings */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-4 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="material-symbols-outlined text-2xl">confirmation_number</span>
            <span className="text-[11px] font-bold text-secondary dark:text-teal-300 bg-secondary-container/40 px-2 py-0.5 rounded">
              Live
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400">Total Bookings</p>
          <h3 className="text-lg md:text-xl font-bold text-primary dark:text-white mt-0.5">
            {todayBookingsCount} tickets
          </h3>
        </div>

        {/* Supported Routes */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-4 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="material-symbols-outlined text-2xl">alt_route</span>
            <span className="text-[11px] font-bold text-secondary dark:text-teal-300 bg-secondary-container/40 px-2 py-0.5 rounded">
              {cities.length} Hubs
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400">Active Schedules</p>
          <h3 className="text-lg md:text-xl font-bold text-primary dark:text-white mt-0.5">
            {schedules.length} trips
          </h3>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-surface-variant dark:border-slate-800 pb-2 no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: 'dashboard' },
          { id: 'buses', label: `Fleet Units (${buses.length})`, icon: 'directions_bus' },
          { id: 'schedules', label: `Trips & Schedules (${schedules.length})`, icon: 'schedule' },
          { id: 'bookings', label: `Reservations (${bookings.length})`, icon: 'confirmation_number' },
          { id: 'cities', label: `Hub Cities (${cities.length})`, icon: 'location_city' },
          { id: 'users', label: `User Accounts (${users.length})`, icon: 'people' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-surface-container-lowest dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low border border-outline-variant/40 dark:border-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reservations list */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-surface-container-high dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-primary dark:text-white">
                Recent Passenger Reservations
              </h2>
              <button
                onClick={() => setActiveTab('bookings')}
                className="text-xs text-secondary dark:text-teal-300 font-bold hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-surface dark:bg-slate-800/60 rounded-xl border border-outline-variant/30 flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary dark:text-white">{b.id}</span>
                      <span className="font-semibold">{b.passengerName}</span>
                    </div>
                    <p className="text-on-surface-variant dark:text-slate-400 mt-0.5">
                      {b.fromCity} → {b.toCity} (Seats: {b.seatNumbers.join(', ')})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary dark:text-teal-300 block">
                      {formatMMK(b.totalPriceMMK)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 block font-medium">
                      {b.paymentMethod}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        b.status === 'Upcoming'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : b.status === 'Cancelled'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Schedule Monitor */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-surface-container-high dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-primary dark:text-white">
                Scheduled Daily Departures
              </h2>
              <button
                onClick={() => setActiveTab('schedules')}
                className="text-xs text-secondary dark:text-teal-300 font-bold hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {schedules.slice(0, 5).map((sch) => {
                const bookedCount = sch.bookedSeats.length;
                const capacity = 24;
                const pct = Math.round((bookedCount / capacity) * 100);

                return (
                  <div
                    key={sch.id}
                    className="p-3 bg-surface dark:bg-slate-800/60 rounded-xl border border-outline-variant/30 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-primary dark:text-white">
                        {sch.fromCity} → {sch.toCity} ({sch.departureTime})
                      </span>
                      <span className="text-secondary dark:text-teal-300 font-mono">
                        {sch.busCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-surface-container-high dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                        {bookedCount}/24 Seats ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BUSES FLEET */}
      {activeTab === 'buses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-primary dark:text-white">Fleet Management</h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Manage registered highway coaches, seating classes, and bus maintenance status
              </p>
            </div>
            <button
              onClick={handleOpenAddBus}
              className="px-4 py-2 bg-secondary hover:bg-[#00504c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add New Bus</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map((bus) => (
              <div
                key={bus.id}
                className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 border border-surface-container-high dark:border-slate-800 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-container/20 text-primary dark:text-teal-300">
                      {bus.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bus.status === 'Active'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-variant text-outline'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-primary dark:text-white mb-1">
                    {bus.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-2">
                    Plate: <strong className="font-mono">{bus.plateNumber}</strong> • {bus.type}
                  </p>

                  <div className="text-xs text-on-surface-variant dark:text-slate-400 space-y-1 mb-4">
                    <p>Total Seats: <strong className="text-primary dark:text-white">24 Seats</strong></p>
                    <p className="line-clamp-2">Amenities: {bus.amenities.join(', ')}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-outline-variant/30 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEditBus(bus)}
                    className="flex-1 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-primary dark:text-white hover:bg-surface-container-low cursor-pointer"
                  >
                    Edit Bus
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete bus ${bus.name}?`)) onDeleteBus(bus.id);
                    }}
                    className="p-1.5 text-error hover:bg-error-container/20 rounded-lg cursor-pointer"
                    title="Delete Bus"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-primary dark:text-white">Trips & Schedules</h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Configure departure times, intercity routes, pricing, and bus assignments
              </p>
            </div>
            <button
              onClick={handleOpenAddSchedule}
              className="px-4 py-2 bg-secondary hover:bg-[#00504c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add New Trip</span>
            </button>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-surface-container-high dark:border-slate-800 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low dark:bg-slate-800/80 text-on-surface-variant dark:text-slate-400 uppercase font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="p-3.5">Bus & Code</th>
                  <th className="p-3.5">Route</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Booked Seats</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 dark:divide-slate-800">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-surface-container-low/50">
                    <td className="p-3.5">
                      <p className="font-bold text-primary dark:text-white">{sch.busName}</p>
                      <span className="font-mono text-[11px] text-secondary dark:text-teal-300">
                        {sch.busCode}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-primary dark:text-white">
                        {sch.fromCity} → {sch.toCity}
                      </p>
                      <span className="text-[11px] text-on-surface-variant dark:text-slate-400">
                        {sch.fromTerminal.split(' ')[0]} to {sch.toTerminal.split(' ')[0]}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-primary dark:text-white">{sch.travelDate}</p>
                      <span className="text-[11px] text-on-surface-variant dark:text-slate-400">
                        {sch.departureTime} → {sch.arrivalTime}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-primary dark:text-teal-300">
                      {formatMMK(sch.priceMMK)}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-primary dark:text-white">
                        {sch.bookedSeats.length} / 24
                      </span>{' '}
                      Seats
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingSchedule(sch);
                          setSchBusId(sch.busId);
                          setSchFrom(sch.fromCity);
                          setSchTo(sch.toCity);
                          setSchFromTerm(sch.fromTerminal);
                          setSchToTerm(sch.toTerminal);
                          setSchDepTime(sch.departureTime);
                          setSchArrTime(sch.arrivalTime);
                          setSchDuration(sch.durationText);
                          setSchPrice(sch.priceMMK.toString());
                          setSchDate(sch.travelDate);
                          setScheduleModalOpen(true);
                        }}
                        className="p-1.5 text-secondary hover:bg-secondary-container/30 rounded-lg cursor-pointer"
                        title="Edit Trip"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete trip ${sch.fromCity} -> ${sch.toCity}?`)) {
                            onDeleteSchedule(sch.id);
                          }
                        }}
                        className="p-1.5 text-error hover:bg-error-container/20 rounded-lg cursor-pointer"
                        title="Delete Trip"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: RESERVATIONS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-primary dark:text-white">All Reservations</h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Complete list of passenger bookings, boarding status, and payment logs
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-surface-container-high dark:border-slate-800 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low dark:bg-slate-800/80 text-on-surface-variant dark:text-slate-400 uppercase font-semibold border-b border-outline-variant/40">
                <tr>
                  <th className="p-3.5">Booking ID</th>
                  <th className="p-3.5">Passenger</th>
                  <th className="p-3.5">Route & Date</th>
                  <th className="p-3.5">Seats</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 dark:divide-slate-800">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container-low/50">
                    <td className="p-3.5 font-mono font-bold text-primary dark:text-teal-300">
                      {b.id}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-primary dark:text-white">{b.passengerName}</p>
                      <span className="text-[11px] text-on-surface-variant dark:text-slate-400">
                        {b.contactPhone}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-primary dark:text-white">
                        {b.fromCity} → {b.toCity}
                      </p>
                      <span className="text-[11px] text-on-surface-variant dark:text-slate-400">
                        {b.travelDate} ({b.departureTime})
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-secondary dark:text-teal-300">
                      {b.seatNumbers.join(', ')}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-primary dark:text-white">
                        {formatMMK(b.totalPriceMMK)}
                      </p>
                      <span className="inline-block text-[10px] font-semibold text-secondary dark:text-teal-300 bg-secondary-container/40 dark:bg-teal-950 px-2 py-0.5 rounded-md mt-0.5">
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={b.status}
                        onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as any)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border-none outline-none cursor-pointer ${
                          b.status === 'Upcoming'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : b.status === 'Completed'
                            ? 'bg-surface-variant text-on-surface-variant'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          const newStatus = b.status === 'Cancelled' ? 'Upcoming' : 'Cancelled';
                          onUpdateBookingStatus(b.id, newStatus);
                        }}
                        className="text-xs text-secondary hover:underline cursor-pointer"
                      >
                        {b.status === 'Cancelled' ? 'Restore to Upcoming' : 'Cancel Booking'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: CITIES */}
      {activeTab === 'cities' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-primary dark:text-white">Supported Hub Cities</h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Cities and highway bus hubs connected by Route X transit network
              </p>
            </div>
            <button
              onClick={() => setCityModalOpen(true)}
              className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add City</span>
            </button>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 border border-surface-container-high dark:border-slate-800 divide-y divide-outline-variant/20 dark:divide-slate-800">
            {cities.map((city, idx) => (
              <div key={city} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary-container/40 text-secondary dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary dark:text-white">{city}</h4>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400">
                      Terminal Hub Active
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-secondary dark:text-teal-300 bg-secondary-container/30 px-2 py-0.5 rounded-full">
                  Primary Destination
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-primary dark:text-white">User Accounts</h2>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Database
                </span>
              </div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
                All registered passenger profiles and system administrator accounts
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualRefreshUsers}
                disabled={isRefreshingUsers}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface dark:bg-slate-800 hover:bg-surface-variant dark:hover:bg-slate-700 text-primary dark:text-white text-xs font-semibold rounded-xl border border-surface-variant dark:border-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Fetch latest registered users from server"
              >
                <span
                  className={`material-symbols-outlined text-base ${
                    isRefreshingUsers ? 'animate-spin text-secondary dark:text-teal-400' : ''
                  }`}
                >
                  refresh
                </span>
                <span>{isRefreshingUsers ? 'Syncing...' : 'Refresh Users'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface-container-lowest dark:bg-slate-900 p-3.5 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
              <p className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-400">Total Users</p>
              <p className="text-xl font-bold text-primary dark:text-white mt-1">{users.length}</p>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-900 p-3.5 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
              <p className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-400">Passengers</p>
              <p className="text-xl font-bold text-secondary dark:text-teal-400 mt-1">
                {users.filter((u) => u.role === 'passenger').length}
              </p>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-900 p-3.5 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
              <p className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-400">Administrators</p>
              <p className="text-xl font-bold text-primary dark:text-indigo-400 mt-1">
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-900 p-3.5 rounded-xl border border-surface-container-high dark:border-slate-800 shadow-2xs">
              <p className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-400">Active Status</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {users.filter((u) => !u.status || u.status === 'Active').length}
              </p>
            </div>
          </div>

          {/* Search and Role Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-lg">
                search
              </span>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, phone, or user ID..."
                className="w-full pl-9 pr-8 py-2 bg-surface dark:bg-slate-800 rounded-xl text-xs border border-surface-variant dark:border-slate-700 focus:border-secondary outline-none text-primary dark:text-white placeholder:text-outline-variant dark:placeholder:text-slate-500 transition-colors"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary dark:hover:text-white"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  userRoleFilter === 'all'
                    ? 'bg-primary dark:bg-teal-700 text-white'
                    : 'bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:bg-surface-variant'
                }`}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('passenger')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  userRoleFilter === 'passenger'
                    ? 'bg-secondary dark:bg-teal-600 text-white'
                    : 'bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:bg-surface-variant'
                }`}
              >
                Passengers ({users.filter((u) => u.role === 'passenger').length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  userRoleFilter === 'admin'
                    ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                    : 'bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:bg-surface-variant'
                }`}
              >
                Admins ({users.filter((u) => u.role === 'admin').length})
              </button>
            </div>
          </div>

          {/* User Cards Grid */}
          {(() => {
            const cleanSearch = userSearch.trim().toLowerCase();
            const filteredUsers = users.filter((u) => {
              const matchesSearch =
                !cleanSearch ||
                u.name.toLowerCase().includes(cleanSearch) ||
                u.email.toLowerCase().includes(cleanSearch) ||
                u.phone.toLowerCase().includes(cleanSearch) ||
                u.id.toLowerCase().includes(cleanSearch);
              const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
              return matchesSearch && matchesRole;
            });

            if (filteredUsers.length === 0) {
              return (
                <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-surface-container-high dark:border-slate-800">
                  <span className="material-symbols-outlined text-4xl text-outline-variant dark:text-slate-600 mb-2">
                    group_off
                  </span>
                  <h3 className="text-sm font-bold text-primary dark:text-white">No user records match</h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {userSearch
                      ? `No registered accounts found matching "${userSearch}".`
                      : 'No users registered yet.'}
                  </p>
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="mt-3 text-xs font-semibold text-secondary hover:underline cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((u) => {
                  const userBookings = bookings.filter((b) => b.userId === u.id);
                  const userStatus = u.status || 'Active';
                  const regDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'System Default';

                  return (
                    <div
                      key={u.id}
                      className="bg-surface-container-lowest dark:bg-slate-900 p-4 rounded-2xl border border-surface-container-high dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-secondary/30 transition-all"
                    >
                      {/* Top row: Avatar, Name, Badges */}
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          user={u}
                          photoUrl={u.avatarUrl}
                          className="w-12 h-12 rounded-full border border-secondary/30 flex-shrink-0"
                          textClassName="text-sm font-bold"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className="text-sm font-bold text-primary dark:text-white truncate" title={u.name}>
                              {u.name}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                u.role === 'admin'
                                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                                  : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20'
                              }`}
                            >
                              {u.role === 'admin' ? 'Admin' : 'Passenger'}
                            </span>
                          </div>

                          {/* Account Status Badge */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                userStatus === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : userStatus === 'Suspended'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  userStatus === 'Active'
                                    ? 'bg-emerald-500'
                                    : userStatus === 'Suspended'
                                    ? 'bg-rose-500'
                                    : 'bg-slate-500'
                                }`}
                              ></span>
                              {userStatus}
                            </span>

                            {userBookings.length > 0 && (
                              <span className="text-[10px] bg-secondary-container/40 text-on-secondary-container font-medium px-1.5 py-0.5 rounded">
                                {userBookings.length} booking{userBookings.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="mt-3.5 pt-3 border-t border-outline-variant/30 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-300">
                          <span className="material-symbols-outlined text-sm text-outline-variant dark:text-slate-500">
                            mail
                          </span>
                          <span className="truncate select-all" title={u.email}>
                            {u.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-300">
                          <span className="material-symbols-outlined text-sm text-outline-variant dark:text-slate-500">
                            call
                          </span>
                          <span>{u.phone || 'No phone provided'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-outline dark:text-slate-400">
                          <span className="material-symbols-outlined text-sm text-outline-variant dark:text-slate-500">
                            calendar_today
                          </span>
                          <span>Joined: {regDate}</span>
                        </div>
                      </div>

                      {/* Footer: User ID & Status Management */}
                      <div className="mt-3 pt-2.5 border-t border-outline-variant/20 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-outline dark:text-slate-500">ID:</span>
                          <code className="text-[10px] font-mono text-primary dark:text-slate-300 truncate max-w-[120px] bg-surface dark:bg-slate-800 px-1 py-0.5 rounded">
                            {u.id}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyUserId(u.id)}
                            className="text-outline-variant hover:text-secondary dark:hover:text-teal-400 p-0.5"
                            title="Copy User ID"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {copiedUserId === u.id ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>

                        {onUpdateUserStatus && u.role !== 'admin' && (
                          <select
                            value={userStatus}
                            onChange={(e) =>
                              onUpdateUserStatus(
                                u.id,
                                e.target.value as 'Active' | 'Suspended' | 'Inactive'
                              )
                            }
                            className="text-[10px] font-semibold bg-surface dark:bg-slate-800 border border-outline-variant/50 dark:border-slate-700 rounded px-1.5 py-0.5 text-primary dark:text-white outline-none cursor-pointer"
                          >
                            <option value="Active">Active</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Bus Modal */}
      {busModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-primary dark:text-white">
                {editingBus ? 'Edit Bus Unit' : 'Add New Fleet Bus'}
              </h3>
              <button
                onClick={() => setBusModalOpen(false)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                  Bus Name / Brand
                </label>
                <input
                  type="text"
                  value={busName}
                  onChange={(e) => setBusName(e.target.value)}
                  placeholder="e.g. Scania Elite VIP"
                  className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Bus Code
                  </label>
                  <input
                    type="text"
                    value={busCode}
                    onChange={(e) => setBusCode(e.target.value)}
                    placeholder="e.g. RX-009"
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    value={busPlate}
                    onChange={(e) => setBusPlate(e.target.value)}
                    placeholder="YGN-7B-8921"
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                  Seating Class
                </label>
                <select
                  value={busType}
                  onChange={(e) => setBusType(e.target.value as any)}
                  className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                >
                  <option value="VIP Seating">VIP Seating (24 Seats)</option>
                  <option value="Standard AC">Standard AC (24 Seats)</option>
                  <option value="Luxury Suite">Luxury Suite (24 Seats)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={busAmenities}
                  onChange={(e) => setBusAmenities(e.target.value)}
                  placeholder="Wi-Fi, AC, Reclining Seats, USB"
                  className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBusModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-outline-variant text-xs text-primary dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-secondary text-white text-xs font-bold shadow-xs hover:bg-[#00504c] cursor-pointer"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-outline-variant dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-primary dark:text-white">
                {editingSchedule ? 'Edit Trip Schedule' : 'Add New Trip Schedule'}
              </h3>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                  Assigned Bus
                </label>
                <select
                  value={schBusId}
                  onChange={(e) => setSchBusId(e.target.value)}
                  className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    From City
                  </label>
                  <select
                    value={schFrom}
                    onChange={(e) => setSchFrom(e.target.value as any)}
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                  >
                    {cities.map((c) => (
                      <option key={`sch-from-${c}`} value={c} disabled={c === schTo}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    To City
                  </label>
                  <select
                    value={schTo}
                    onChange={(e) => setSchTo(e.target.value as any)}
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                  >
                    {cities.map((c) => (
                      <option key={`sch-to-${c}`} value={c} disabled={c === schFrom}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Departure Terminal
                  </label>
                  <input
                    type="text"
                    value={schFromTerm}
                    onChange={(e) => setSchFromTerm(e.target.value)}
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Arrival Terminal
                  </label>
                  <input
                    type="text"
                    value={schToTerm}
                    onChange={(e) => setSchToTerm(e.target.value)}
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Departure Time
                  </label>
                  <input
                    type="text"
                    value={schDepTime}
                    onChange={(e) => setSchDepTime(e.target.value)}
                    placeholder="08:00 PM"
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Arrival Time
                  </label>
                  <input
                    type="text"
                    value={schArrTime}
                    onChange={(e) => setSchArrTime(e.target.value)}
                    placeholder="05:00 AM"
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={schDuration}
                    onChange={(e) => setSchDuration(e.target.value)}
                    placeholder="9h 00m"
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={schDate}
                    onChange={(e) => setSchDate(e.target.value)}
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1">
                    Ticket Price (MMK)
                  </label>
                  <input
                    type="number"
                    value={schPrice}
                    onChange={(e) => setSchPrice(e.target.value)}
                    placeholder="35000"
                    className="w-full p-2 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-xs text-primary dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-outline-variant text-xs text-primary dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-secondary text-white text-xs font-bold shadow-xs hover:bg-[#00504c] cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* City Modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant dark:border-slate-800">
            <h3 className="text-base font-bold text-primary dark:text-white mb-3">
              Add New Hub City
            </h3>
            <form onSubmit={handleAddCitySubmit} className="space-y-3">
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="e.g. Naypyidaw, Mawlamyine"
                className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg text-sm text-primary dark:text-white"
                required
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCityModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-outline-variant text-xs text-primary dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-secondary text-white text-xs font-bold shadow-xs hover:bg-[#00504c] cursor-pointer"
                >
                  Add Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
