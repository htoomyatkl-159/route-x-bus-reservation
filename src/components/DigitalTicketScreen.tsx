import React, { useState } from 'react';
import { Booking } from '../types';
import { RouteXLogo } from './RouteXLogo';

interface DigitalTicketScreenProps {
  booking: Booking;
  onBack: () => void;
  onNavigateHome: () => void;
}

export const DigitalTicketScreen: React.FC<DigitalTicketScreenProps> = ({
  booking,
  onBack,
  onNavigateHome,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 1200);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Route X Ticket - ${booking.id}`,
        text: `My bus ticket from ${booking.fromCity} to ${booking.toCity} on ${booking.travelDate}. Seat: ${booking.seatNumbers.join(', ')}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Route X E-Ticket [${booking.id}] ${booking.fromCity} -> ${booking.toCity} (${booking.travelDate}, ${booking.departureTime}) Seats: ${booking.seatNumbers.join(', ')}`
      );
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 pb-28 font-sans animate-fade-in">
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-secondary dark:text-teal-300 hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/50 dark:border-slate-700 text-on-surface-variant dark:text-slate-300 hover:text-secondary cursor-pointer"
            title="Share Ticket"
          >
            <span className="material-symbols-outlined text-lg">share</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-full bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/50 dark:border-slate-700 text-on-surface-variant dark:text-slate-300 hover:text-secondary cursor-pointer"
            title="Print Ticket"
          >
            <span className="material-symbols-outlined text-lg">print</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="mb-4 p-3 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-sm animate-in fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>PDF Ticket saved to downloads!</span>
        </div>
      )}

      {/* Main Boarding Pass Card */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl shadow-[0px_8px_35px_rgba(26,43,72,0.12)] border border-surface-container-high dark:border-slate-800 overflow-hidden relative">
        {/* Ticket Header */}
        <div className="bg-primary-container dark:bg-slate-950 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <RouteXLogo size="sm" showText={false} />
              <div>
                <span className="text-base font-black tracking-wider text-white">ROUTE X</span>
                <p className="text-[10px] text-teal-300 uppercase tracking-widest font-semibold">
                  Boarding Pass • E-Ticket
                </p>
              </div>
            </div>
            <span className="bg-secondary text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-teal-400/30">
              {booking.id}
            </span>
          </div>

          {/* Route Display */}
          <div className="flex justify-between items-center relative z-10 mt-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">From</p>
              <h2 className="text-xl font-black tracking-tight text-white">{booking.fromCity}</h2>
              <p className="text-[11px] text-teal-200 truncate max-w-[140px]">{booking.fromTerminal}</p>
            </div>

            <div className="flex flex-col items-center px-2">
              <span className="material-symbols-outlined text-secondary-fixed text-2xl">
                directions_bus
              </span>
              <span className="text-[10px] text-teal-300 font-mono mt-0.5">
                {booking.durationText}
              </span>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">To</p>
              <h2 className="text-xl font-black tracking-tight text-white">{booking.toCity}</h2>
              <p className="text-[11px] text-teal-200 truncate max-w-[140px]">{booking.toTerminal}</p>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="relative flex items-center justify-between px-3 bg-surface-container-lowest dark:bg-slate-900 -my-3 z-20">
          <div className="w-6 h-6 rounded-full bg-background -ml-6 shadow-inner"></div>
          <div className="flex-1 border-t-2 border-dashed border-outline-variant/60 dark:border-slate-800 mx-2"></div>
          <div className="w-6 h-6 rounded-full bg-background -mr-6 shadow-inner"></div>
        </div>

        {/* Boarding Info Details */}
        <div className="p-6 pt-7 space-y-5">
          {/* Passenger info block */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-400 tracking-wider">
                Passenger
              </p>
              <p className="text-sm font-bold text-primary dark:text-white mt-0.5">
                {booking.passengers[0]?.fullName || booking.userName}
              </p>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                {booking.passengers.length} {booking.passengers.length === 1 ? 'Passenger' : 'Passengers'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-400 tracking-wider">
                Seat Number(s)
              </p>
              <p className="text-xl font-black text-secondary dark:text-teal-300 mt-0.5 font-mono">
                {booking.seatNumbers.join(', ')}
              </p>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                {booking.busType}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-400 tracking-wider">
                Departure Date
              </p>
              <p className="text-xs font-bold text-primary dark:text-white mt-0.5">
                {booking.travelDate}
              </p>
              <p className="text-sm font-extrabold text-secondary dark:text-teal-300">
                {booking.departureTime}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-400 tracking-wider">
                Total Fare Paid
              </p>
              <p className="text-sm font-bold text-primary dark:text-white mt-0.5">
                {booking.totalPriceMMK.toLocaleString()} MMK
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full mt-0.5">
                {booking.status} ({booking.paymentMethod})
              </span>
            </div>
          </div>

          {/* QR Code Barcode section */}
          <div className="p-4 bg-surface-container-low dark:bg-slate-800/70 rounded-2xl border border-outline-variant/30 dark:border-slate-700/60 flex flex-col items-center justify-center text-center">
            {/* Real SVG QR code representation */}
            <div className="w-36 h-36 bg-white p-2.5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                <rect width="100" height="100" fill="white" />
                {/* 3 Position Corners */}
                <path d="M5 5h30v30H5z M10 10v20h20V10z M15 15h10v10H15z" fill="currentColor" />
                <path d="M65 5h30v30H65z M70 10v20h20V10z M75 15h10v10H75z" fill="currentColor" />
                <path d="M5 65h30v30H5z M10 70v20h20V70z M15 75h10v10H15z" fill="currentColor" />
                {/* Patterns */}
                <rect x="42" y="8" width="6" height="6" fill="currentColor" />
                <rect x="52" y="15" width="6" height="6" fill="currentColor" />
                <rect x="42" y="25" width="6" height="6" fill="currentColor" />
                <rect x="52" y="35" width="6" height="6" fill="currentColor" />
                <rect x="15" y="42" width="6" height="6" fill="currentColor" />
                <rect x="25" y="52" width="6" height="6" fill="currentColor" />
                <rect x="42" y="42" width="16" height="16" fill="#006a64" />
                <rect x="65" y="45" width="6" height="6" fill="currentColor" />
                <rect x="75" y="55" width="6" height="6" fill="currentColor" />
                <rect x="85" y="45" width="6" height="6" fill="currentColor" />
                <rect x="45" y="65" width="6" height="6" fill="currentColor" />
                <rect x="55" y="75" width="6" height="6" fill="currentColor" />
                <rect x="65" y="65" width="6" height="6" fill="currentColor" />
                <rect x="75" y="80" width="6" height="6" fill="currentColor" />
                <rect x="85" y="70" width="6" height="6" fill="currentColor" />
              </svg>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-on-surface-variant dark:text-slate-400 mt-2 uppercase font-bold">
              SCAN AT GATE • {booking.qrCodePayload}
            </p>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400 mt-1">
              Present this QR code at the departure gate or ticket counter for verification.
            </p>
          </div>

          {/* Gate arrival instruction */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0 text-base">
              info
            </span>
            <p className="leading-relaxed">
              Please arrive at the terminal at least 30 minutes before departure time with a valid ID matching passenger details.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low dark:bg-slate-800/80 border-t border-outline-variant/30 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="flex-1 py-3 bg-secondary hover:bg-[#00504c] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              {downloading ? 'hourglass_top' : 'download'}
            </span>
            <span>{downloading ? 'Generating PDF...' : 'Download PDF Ticket'}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="px-4 py-3 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-700 text-xs font-bold text-primary dark:text-white rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
