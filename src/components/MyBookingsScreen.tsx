import React, { useState } from 'react';
import { Booking } from '../types';

interface MyBookingsScreenProps {
  bookings: Booking[];
  onViewTicket: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onNewSearch: () => void;
}

export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({
  bookings,
  onViewTicket,
  onCancelBooking,
  onNewSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);

  const filteredBookings = bookings.filter((b) => {
    if (b.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.fromCity.toLowerCase().includes(q) ||
        b.toCity.toLowerCase().includes(q) ||
        b.busName.toLowerCase().includes(q) ||
        b.seatNumbers.join(',').includes(q)
      );
    }
    return true;
  });

  const countByStatus = {
    Upcoming: bookings.filter((b) => b.status === 'Upcoming').length,
    Completed: bookings.filter((b) => b.status === 'Completed').length,
    Cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
  };

  const handleConfirmCancel = () => {
    if (cancelModalId) {
      onCancelBooking(cancelModalId);
      setCancelModalId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-5 pb-28 md:pb-12 space-y-6 font-sans animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white tracking-tight">
            My Bookings
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-400">
            View, track, or manage your reserved bus journeys
          </p>
        </div>

        <button
          onClick={onNewSearch}
          className="self-start md:self-auto px-4 py-2 bg-secondary hover:bg-[#00504c] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Find a Bus</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-surface-variant dark:border-slate-800 gap-2">
        {(['Upcoming', 'Completed', 'Cancelled'] as const).map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-secondary text-secondary dark:text-teal-300'
                  : 'border-transparent text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-secondary-container dark:bg-teal-900 text-on-secondary-container dark:text-teal-200'
                    : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant'
                }`}
              >
                {countByStatus[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Filter input */}
      {bookings.length > 0 && (
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search by Booking ID, route, bus, or seat number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 dark:border-slate-800 rounded-xl text-xs md:text-sm text-primary dark:text-white outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>
      )}

      {/* Booking List Cards / Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-10 text-center border border-surface-container-high dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-surface-container-low dark:bg-slate-800 flex items-center justify-center mx-auto text-secondary dark:text-teal-400">
            <span className="material-symbols-outlined text-3xl">confirmation_number</span>
          </div>
          <h3 className="text-base md:text-lg font-bold text-primary dark:text-white">
            {bookings.length === 0 ? 'No bookings yet' : `No ${activeTab.toLowerCase()} bookings`}
          </h3>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-sm mx-auto">
            {bookings.length === 0
              ? "You haven't made any bus reservations yet. Plan your next trip in just a few taps!"
              : activeTab === 'Upcoming'
              ? 'You have no scheduled trips coming up. Plan your next adventure today!'
              : `No bookings found under the ${activeTab.toLowerCase()} category.`}
          </p>
          <div className="pt-2">
            <button
              onClick={onNewSearch}
              className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#00504c] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Find a Bus</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isUpcoming = booking.status === 'Upcoming';
            const isCancelled = booking.status === 'Cancelled';
            const isPaid = booking.paymentStatus === 'Paid';

            return (
              <div
                key={booking.id}
                className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-surface-container-high dark:border-slate-800 hover:shadow-md transition-all space-y-4"
              >
                {/* Card Top: Booking ID + Booking Status + Payment Status */}
                <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-outline-variant/30 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary dark:text-teal-300 bg-surface-container dark:bg-slate-800 px-2 py-0.5 rounded">
                      ID: {booking.id}
                    </span>
                    {booking.createdAt && (
                      <span className="text-xs text-on-surface-variant dark:text-slate-400">
                        Booked: {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Payment Status */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isPaid
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : booking.paymentStatus === 'Refunded'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>
                        {booking.paymentStatus} ({booking.paymentMethod})
                      </span>
                    </span>

                    {/* Booking Status */}
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isUpcoming
                          ? 'bg-secondary-container dark:bg-teal-950 text-secondary dark:text-teal-300'
                          : isCancelled
                          ? 'bg-error-container/40 text-error'
                          : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Route + Timing Info */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-primary dark:text-white">
                        {booking.fromCity}
                      </p>
                      <p className="text-xs text-secondary dark:text-teal-300 font-semibold">
                        {booking.departureTime}
                      </p>
                      {booking.fromTerminal && (
                        <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate max-w-[120px] md:max-w-[150px]">
                          {booking.fromTerminal}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-center px-3">
                      <span className="text-[11px] font-bold text-primary dark:text-slate-200">
                        {booking.travelDate}
                      </span>
                      <div className="w-24 md:w-32 flex items-center my-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                        <div className="flex-1 h-[1.5px] bg-outline-variant dark:bg-slate-700"></div>
                        <span className="material-symbols-outlined text-xs text-secondary mx-0.5">
                          directions_bus
                        </span>
                        <div className="flex-1 h-[1.5px] bg-outline-variant dark:bg-slate-700"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                      </div>
                      <span className="text-[10px] text-on-surface-variant dark:text-slate-400 font-medium">
                        {booking.durationText || 'Express'}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold text-primary dark:text-white">
                        {booking.toCity}
                      </p>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 font-semibold">
                        {booking.arrivalTime || 'Arrival'}
                      </p>
                      {booking.toTerminal && (
                        <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate max-w-[120px] md:max-w-[150px]">
                          {booking.toTerminal}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Seat Number + Bus Name + Price + Actions */}
                  <div className="md:col-span-4 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-outline-variant/30 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
                    <div className="text-left md:text-right space-y-0.5">
                      <p className="text-xs text-primary dark:text-white font-semibold">
                        Bus: <span className="font-bold text-secondary dark:text-teal-300">{booking.busName}</span>
                      </p>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400">
                        Seat Number: <span className="font-bold text-primary dark:text-white">{booking.seatNumbers.join(', ')}</span>
                      </p>
                      <p className="text-sm md:text-base font-bold text-secondary dark:text-teal-300">
                        {booking.totalPriceMMK.toLocaleString()} MMK
                      </p>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {isUpcoming && (
                        <button
                          type="button"
                          onClick={() => setCancelModalId(booking.id)}
                          className="px-3 py-1.5 text-xs text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onViewTicket(booking.id)}
                        className="px-4 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#00504c] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">qr_code</span>
                        <span>View Ticket</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant dark:border-slate-800 text-center">
            <div className="w-14 h-14 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl">cancel</span>
            </div>
            <h3 className="text-base font-bold text-primary dark:text-white mb-1">
              Cancel Booking?
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-5">
              Are you sure you want to cancel this booking? Refund will be processed back to your original payment method within 24-48 hours.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancelModalId(null)}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface dark:text-slate-300 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-lg bg-error hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
