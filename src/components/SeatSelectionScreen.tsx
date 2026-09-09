import React, { useState } from 'react';
import { TripSchedule } from '../types';

interface SeatSelectionScreenProps {
  trip: TripSchedule;
  onContinue: (selectedSeats: number[], totalPrice: number) => Promise<void> | void;
  onBack: () => void;
  isLoading?: boolean;
}

export const SeatSelectionScreen: React.FC<SeatSelectionScreenProps> = ({
  trip,
  onContinue,
  onBack,
  isLoading = false,
}) => {
  // Start with no seats selected
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const seatPrice = trip.priceMMK || 35000;
  const totalPrice = selectedSeats.length * seatPrice;
  const lockedSeats = trip.lockedSeats || [];

  // Toggle seat click
  const handleSeatClick = (seatNum: number) => {
    setErrorMsg('');

    if (trip.bookedSeats.includes(seatNum)) {
      setErrorMsg(`Seat ${seatNum} is already booked.`);
      return;
    }

    if (lockedSeats.includes(seatNum)) {
      setErrorMsg(`Seat ${seatNum} is currently being booked by another passenger. Please select another seat.`);
      return;
    }

    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNum));
    } else {
      // Max 6 seats per booking
      if (selectedSeats.length >= 6) {
        setErrorMsg('You can select a maximum of 6 seats per transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatNum].sort((a, b) => a - b));
    }
  };

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      setErrorMsg('Please select at least 1 seat to proceed.');
      return;
    }
    const finalPrice = totalPrice > 0 ? totalPrice : selectedSeats.length * seatPrice;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onContinue(selectedSeats, finalPrice);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to lock seats. Please select other seats.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 24 seats arranged in 6 rows of 4 (2 + aisle + 2)
  const rows = [
    { left: [1, 2], right: [3, 4] },
    { left: [5, 6], right: [7, 8] },
    { left: [9, 10], right: [11, 12] },
    { left: [13, 14], right: [15, 16] },
    { left: [17, 18], right: [19, 20] },
    { left: [21, 22], right: [23, 24] },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 pb-36 font-sans antialiased animate-fade-in">
      {/* Route Summary & Stepper */}
      <div className="w-full bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-[0px_4px_20px_rgba(26,43,72,0.05)] border border-surface-container-high dark:border-slate-800 mb-6 text-center">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center max-w-xs mx-auto mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
          <div className="flex-1 h-0.5 bg-secondary"></div>
          <div className="w-3 h-3 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
          <div className="flex-1 h-0.5 bg-surface-variant dark:bg-slate-700"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-surface-variant dark:bg-slate-700"></div>
          <div className="flex-1 h-0.5 bg-surface-variant dark:bg-slate-700"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-surface-variant dark:bg-slate-700"></div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 mb-1">
          Route & Schedule
        </p>
        <div className="flex items-center justify-center gap-2 text-lg md:text-xl font-bold text-primary dark:text-white mb-1">
          <span>{trip.fromCity}</span>
          <span className="material-symbols-outlined text-secondary dark:text-teal-300 text-base">
            arrow_forward
          </span>
          <span>{trip.toCity}</span>
        </div>
        <p className="text-xs text-on-surface-variant dark:text-slate-400">
          {trip.travelDate} • Departure: {trip.departureTime} • {trip.busName} ({trip.busCode}) • {trip.busType}
        </p>
      </div>

      {/* Legend (Available, Selected, Locked, Booked) */}
      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 mb-6 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-outline-variant bg-surface-container-lowest dark:bg-slate-800"></div>
          <span className="text-xs text-on-surface-variant dark:text-slate-300 font-medium">
            Available
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs font-bold ring-1 ring-amber-500/50">
            <span className="material-symbols-outlined text-[11px] font-bold">check</span>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
            Selected (Gold)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-500/20 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[11px] text-amber-600 dark:text-amber-400">timer</span>
          </div>
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            Locked (In Progress)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-surface-container-highest/80 dark:bg-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[11px] text-outline">close</span>
          </div>
          <span className="text-xs text-on-surface-variant/70 dark:text-slate-400 font-medium">
            Booked
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-4 max-w-md mx-auto p-3.5 bg-error-container text-on-error-container text-xs rounded-xl flex items-start gap-2.5 border border-error/30 animate-shake">
          <span className="material-symbols-outlined text-base text-error shrink-0">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bus Seating Cabin Layout (24 Seats total) */}
      <div className="max-w-md mx-auto bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-surface-container-high dark:border-slate-800 relative">
        {/* Front of Bus / Driver Deck */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-outline-variant/40 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low dark:bg-slate-800 flex items-center justify-center text-outline dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">airline_seat_recline_extra</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400">
              Driver Deck
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant dark:text-slate-400">
            <span className="material-symbols-outlined text-sm text-secondary">meeting_room</span>
            <span>Front Entrance</span>
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-3.5">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center justify-between gap-3">
              {/* Left Column (2 seats) */}
              <div className="flex gap-2.5">
                {row.left.map((seatNum) => {
                  const isBooked = trip.bookedSeats.includes(seatNum);
                  const isLocked = lockedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);

                  return (
                    <button
                      key={seatNum}
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleSeatClick(seatNum)}
                      className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer ${
                        isBooked
                          ? 'bg-surface-container-highest/80 dark:bg-slate-700/60 text-outline/60 cursor-not-allowed border border-transparent opacity-60'
                          : isLocked
                          ? 'bg-amber-500/15 dark:bg-amber-950/40 border border-amber-400/80 dark:border-amber-500/80 text-amber-700 dark:text-amber-300 hover:scale-102 ring-1 ring-amber-400/40'
                          : isSelected
                          ? 'bg-amber-400 dark:bg-amber-400 text-slate-950 font-bold shadow-lg scale-105 ring-2 ring-amber-300 border-amber-300'
                          : 'bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white hover:border-secondary border border-outline-variant/60 dark:border-slate-700 hover:scale-102'
                      }`}
                      title={
                        isBooked
                          ? `Seat ${seatNum} (Already Booked)`
                          : isLocked
                          ? `Seat ${seatNum} (Currently being booked by another passenger)`
                          : isSelected
                          ? `Seat ${seatNum} (Selected)`
                          : `Seat ${seatNum} (${seatPrice.toLocaleString()} MMK)`
                      }
                    >
                      <span className="text-xs font-bold leading-none">{seatNum}</span>
                      {isSelected ? (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 font-bold">check</span>
                      ) : isBooked ? (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 text-outline/50">
                          block
                        </span>
                      ) : isLocked ? (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 text-amber-600 dark:text-amber-400">
                          timer
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 text-outline-variant dark:text-slate-400">
                          event_seat
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Central Aisle */}
              <div className="flex-1 flex justify-center items-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-outline-variant dark:text-slate-500">
                  {rowIdx + 1}
                </span>
              </div>

              {/* Right Column (2 seats) */}
              <div className="flex gap-2.5">
                {row.right.map((seatNum) => {
                  const isBooked = trip.bookedSeats.includes(seatNum);
                  const isLocked = lockedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);

                  return (
                    <button
                      key={seatNum}
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleSeatClick(seatNum)}
                      className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer ${
                        isBooked
                          ? 'bg-surface-container-highest/80 dark:bg-slate-700/60 text-outline/60 cursor-not-allowed border border-transparent opacity-60'
                          : isLocked
                          ? 'bg-amber-500/15 dark:bg-amber-950/40 border border-amber-400/80 dark:border-amber-500/80 text-amber-700 dark:text-amber-300 hover:scale-102 ring-1 ring-amber-400/40'
                          : isSelected
                          ? 'bg-amber-400 dark:bg-amber-400 text-slate-950 font-bold shadow-lg scale-105 ring-2 ring-amber-300 border-amber-300'
                          : 'bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white hover:border-secondary border border-outline-variant/60 dark:border-slate-700 hover:scale-102'
                      }`}
                      title={
                        isBooked
                          ? `Seat ${seatNum} (Already Booked)`
                          : isLocked
                          ? `Seat ${seatNum} (Currently being booked by another passenger)`
                          : isSelected
                          ? `Seat ${seatNum} (Selected)`
                          : `Seat ${seatNum} (${seatPrice.toLocaleString()} MMK)`
                      }
                    >
                      <span className="text-xs font-bold leading-none">{seatNum}</span>
                      {isSelected ? (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 font-bold">check</span>
                      ) : isBooked ? (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 text-outline/50">
                          block
                        </span>
                      ) : isLocked ? (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 text-amber-600 dark:text-amber-400">
                          timer
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[12px] mt-0.5 text-outline-variant dark:text-slate-400">
                          event_seat
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Back of Bus / Restroom */}
        <div className="mt-6 pt-4 border-t border-outline-variant/40 dark:border-slate-800 flex justify-between items-center text-xs text-on-surface-variant dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">wc</span>
            Restroom Available
          </span>
          <span className="text-[11px] font-mono opacity-80">Route X 24-Seats</span>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-outline-variant/60 dark:border-slate-800 p-4 shadow-[0px_-4px_25px_rgba(26,43,72,0.08)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">
              {selectedSeats.length > 0
                ? `Selected Seats: ${selectedSeats.join(', ')} (${selectedSeats.length} ${selectedSeats.length === 1 ? 'Seat' : 'Seats'})`
                : 'No seats selected yet'}
            </p>
            <p className="text-lg md:text-xl font-bold text-primary dark:text-white">
              {totalPrice.toLocaleString()} MMK
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting || isLoading}
              className="px-4 py-3 rounded-xl border border-outline-variant dark:border-slate-700 text-xs md:text-sm font-semibold text-on-surface dark:text-slate-300 hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              disabled={selectedSeats.length === 0 || isSubmitting || isLoading}
              onClick={handleProceed}
              className={`px-6 py-3 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                selectedSeats.length === 0 || isSubmitting || isLoading
                  ? 'bg-surface-container-high dark:bg-slate-800 text-outline cursor-not-allowed'
                  : 'bg-secondary hover:bg-[#00504c] text-white active:scale-95'
              }`}
            >
              {isSubmitting || isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Locking Seats...</span>
                </>
              ) : (
                <>
                  <span>Passenger Details</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
