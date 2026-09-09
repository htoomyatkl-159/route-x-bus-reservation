import React from 'react';
import { Booking } from '../types';

interface ConfirmationScreenProps {
  booking: Booking;
  onViewTicket: (bookingId: string) => void;
  onNavigateToBookings: () => void;
  onReturnHome: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  booking,
  onViewTicket,
  onNavigateToBookings,
  onReturnHome,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 font-sans antialiased animate-fade-in">
      <main className="w-full bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-[0px_4px_30px_rgba(26,43,72,0.08)] overflow-hidden border border-surface-container-high dark:border-slate-800 flex flex-col">
        {/* Header / Success Graphic */}
        <div className="bg-surface-container-low dark:bg-slate-800/80 px-6 py-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-secondary-container dark:bg-teal-950 rounded-full flex items-center justify-center mb-4 shadow-sm relative z-10 border border-secondary/20">
            <span
              className="material-symbols-outlined text-4xl text-secondary dark:text-teal-300"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white mb-1 z-10">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 z-10">
            Your journey has been reserved successfully.
          </p>
        </div>

        {/* Details Payload */}
        <div className="p-6 flex flex-col gap-5">
          {/* Booking Reference */}
          <div className="flex justify-between items-center pb-4 border-b border-surface-variant dark:border-slate-800">
            <span className="text-xs font-semibold text-on-surface-variant dark:text-slate-400">
              Booking Reference
            </span>
            <span className="text-base font-mono font-bold text-primary dark:text-teal-300 tracking-wider">
              {booking.id}
            </span>
          </div>

          {/* Route Overview */}
          <div className="bg-surface dark:bg-slate-800/50 p-3.5 rounded-xl flex items-center justify-between border border-outline-variant/30 dark:border-slate-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-400 tracking-wider">
                Route
              </p>
              <p className="text-sm font-bold text-primary dark:text-white">
                {booking.fromCity} → {booking.toCity}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-400 tracking-wider">
                Travel Date
              </p>
              <p className="text-xs font-bold text-primary dark:text-white">
                {booking.travelDate}
              </p>
            </div>
          </div>

          {/* Bento Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Bus Detail */}
            <div className="bg-surface dark:bg-slate-800/60 p-3.5 rounded-xl flex flex-col justify-between border border-outline-variant/20 dark:border-slate-800">
              <span
                className="material-symbols-outlined text-secondary dark:text-teal-400 mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                directions_bus
              </span>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Operator
                </p>
                <p className="text-sm font-bold text-primary dark:text-white truncate">
                  {booking.busName}
                </p>
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                  {booking.busType}
                </p>
              </div>
            </div>

            {/* Seat Detail */}
            <div className="bg-surface dark:bg-slate-800/60 p-3.5 rounded-xl flex flex-col justify-between border border-outline-variant/20 dark:border-slate-800">
              <span
                className="material-symbols-outlined text-secondary dark:text-teal-400 mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                airline_seat_recline_normal
              </span>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Seat(s)
                </p>
                <p className="text-sm font-bold text-primary dark:text-white">
                  {booking.seatNumbers.join(', ')}
                </p>
                <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                  {booking.seatNumbers.length} {booking.seatNumbers.length === 1 ? 'Seat' : 'Seats'}
                </p>
              </div>
            </div>

            {/* Time Detail */}
            <div className="bg-surface dark:bg-slate-800/60 p-3.5 rounded-xl flex flex-col justify-between border border-outline-variant/20 dark:border-slate-800">
              <span
                className="material-symbols-outlined text-secondary dark:text-teal-400 mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Departure Time
                </p>
                <p className="text-sm font-bold text-primary dark:text-white">
                  {booking.departureTime}
                </p>
              </div>
            </div>

            {/* Payment Total */}
            <div className="bg-surface dark:bg-slate-800/60 p-3.5 rounded-xl flex flex-col justify-between border border-outline-variant/20 dark:border-slate-800">
              <span
                className="material-symbols-outlined text-secondary dark:text-teal-400 mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                receipt_long
              </span>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Total Fare ({booking.paymentMethod})
                </p>
                <p className="text-sm font-bold text-secondary dark:text-teal-300">
                  {booking.totalPriceMMK.toLocaleString()} MMK
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => onViewTicket(booking.id)}
              className="w-full bg-secondary hover:bg-[#00504c] text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
              <span>View Digital Ticket</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={onNavigateToBookings}
                className="flex-1 bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container text-primary dark:text-white py-3 px-4 rounded-xl font-semibold text-xs md:text-sm transition-colors border border-outline-variant/40 dark:border-slate-700 cursor-pointer"
              >
                My Bookings
              </button>
              <button
                onClick={onReturnHome}
                className="flex-1 bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container text-primary dark:text-white py-3 px-4 rounded-xl font-semibold text-xs md:text-sm transition-colors border border-outline-variant/40 dark:border-slate-700 cursor-pointer"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
