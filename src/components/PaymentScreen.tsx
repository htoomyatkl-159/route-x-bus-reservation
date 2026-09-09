import React, { useState, useEffect, useRef } from 'react';
import { PaymentMethod, TripSchedule } from '../types';
import { api } from '../data/api';

interface PaymentScreenProps {
  trip?: TripSchedule | null;
  selectedSeats?: number[];
  totalAmount: number;
  lockExpiresAt?: number | null;
  lockId?: string | null;
  onConfirmPayment: (method: PaymentMethod, simulatedDetails: any) => Promise<void> | void;
  onBack: () => void;
  onExpired: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  trip,
  selectedSeats = [],
  totalAmount,
  lockExpiresAt,
  lockId,
  onConfirmPayment,
  onBack,
  onExpired,
}) => {
  // All 6 payment options
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('KBZPay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  // Wallet phone field starts blank by default
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [simulateDecline, setSimulateDecline] = useState<boolean>(false);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);

  const effectiveTotal = (totalAmount && totalAmount > 0)
    ? totalAmount
    : (selectedSeats.length > 0 ? selectedSeats.length : 1) * (trip?.priceMMK || 35000);

  // 5-minute countdown (300 seconds) or dynamic from lockExpiresAt
  const calculateInitialSeconds = () => {
    if (lockExpiresAt && lockExpiresAt > Date.now()) {
      return Math.max(0, Math.ceil((lockExpiresAt - Date.now()) / 1000));
    }
    return 300; // 5 minutes
  };

  const [timeLeft, setTimeLeft] = useState<number>(calculateInitialSeconds);
  const totalDuration = 300;
  const isExpiredRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isExpiredRef.current) {
            isExpiredRef.current = true;
            setShowExpiredModal(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleExpiredAcknowledge = async () => {
    setShowExpiredModal(false);
    if (trip && lockId) {
      await api.releaseSeatLock(trip.id, lockId).catch(() => {});
    }
    onExpired();
  };

  const handleCancelAndBack = async () => {
    if (trip && lockId) {
      await api.releaseSeatLock(trip.id, lockId).catch(() => {});
    }
    onBack();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isMobileWallet =
    selectedMethod === 'KBZPay' ||
    selectedMethod === 'Wave Pay' ||
    selectedMethod === 'CB Pay' ||
    selectedMethod === 'AYA Pay';

  const progressPercent = Math.min(100, Math.max(0, (timeLeft / totalDuration) * 100));
  const isUrgent = timeLeft < 60;
  const isWarning = timeLeft < 120 && !isUrgent;

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (timeLeft <= 0) {
      setShowExpiredModal(true);
      return;
    }

    // Phone validation for mobile wallet payments
    if (isMobileWallet) {
      const cleanPhone = phoneInput.trim().replace(/[\s-]/g, '');
      if (!cleanPhone) {
        setErrorMessage(`Please enter your ${selectedMethod} registered mobile phone number.`);
        return;
      }
      if (cleanPhone.length < 8 || cleanPhone.length > 13) {
        setErrorMessage('Please enter a valid phone number (e.g. 09XXXXXXXXX).');
        return;
      }
      // Check for simulated failure trigger
      if (cleanPhone === '0900000000' || simulateDecline) {
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          setErrorMessage(
            'Payment Declined: Insufficient wallet balance or transaction rejected. Please verify and try again.'
          );
        }, 1200);
        return;
      }
    }

    // Step 1: Pre-Payment Verification on the Server
    setIsVerifying(true);
    if (trip && selectedSeats.length > 0) {
      try {
        const verify = await api.verifySeats(trip.id, selectedSeats, lockId || undefined);
        if (!verify.available) {
          setIsVerifying(false);
          setErrorMessage(
            verify.error || 'Seat reservation expired or taken by another passenger. Returning to seat selection...'
          );
          setTimeout(() => {
            onExpired();
          }, 2000);
          return;
        }
      } catch (err: any) {
        console.warn('Pre-payment check warning:', err);
      }
    }
    setIsVerifying(false);

    // Step 2: Authorize and Finalize Payment
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await onConfirmPayment(selectedMethod, {
          simulatedPhone: phoneInput.trim() || 'N/A (Cash)',
          simulatedTime: new Date().toISOString(),
          paymentRef: `PAY-${Date.now().toString().slice(-6)}`,
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Payment confirmation failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }, 1400);
  };

  const paymentOptions: {
    id: PaymentMethod;
    name: string;
    description: string;
    tag: string;
    renderIcon: () => React.ReactNode;
  }[] = [
    {
      id: 'KBZPay',
      name: 'KBZPay',
      description: 'Instant digital payment via KBZPay QR or mobile wallet',
      tag: 'Instant',
      renderIcon: () => (
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 overflow-hidden relative p-1.5 shadow-2xs">
          <div className="w-full h-full flex flex-col items-center justify-center bg-blue-600 rounded text-white font-bold text-[10px] leading-tight">
            <span>KBZ</span>
            <span className="text-[8px] opacity-90">Pay</span>
          </div>
        </div>
      ),
    },
    {
      id: 'Wave Pay',
      name: 'Wave Pay',
      description: 'Fast mobile checkout with Wave Money wallet',
      tag: 'Instant',
      renderIcon: () => (
        <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-amber-950 border border-yellow-200 dark:border-yellow-800 flex items-center justify-center shrink-0 overflow-hidden relative p-1.5 shadow-2xs">
          <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-400 rounded text-slate-900 font-bold text-[10px] leading-tight">
            <span>Wave</span>
            <span className="text-[8px]">Money</span>
          </div>
        </div>
      ),
    },
    {
      id: 'CB Pay',
      name: 'CB Pay',
      description: 'Direct mobile payment with CB Bank CB Pay wallet',
      tag: 'Instant',
      renderIcon: () => (
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative p-1.5 shadow-2xs">
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded text-red-500 font-extrabold text-[11px] leading-tight">
            <span className="text-white">CB</span>
            <span className="text-[8px] text-red-400">Pay</span>
          </div>
        </div>
      ),
    },
    {
      id: 'AYA Pay',
      name: 'AYA Pay',
      description: 'Secure mobile checkout with AYA Bank AYA Pay wallet',
      tag: 'Instant',
      renderIcon: () => (
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0 overflow-hidden relative p-1.5 shadow-2xs">
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-600 rounded text-white font-bold text-[10px] leading-tight">
            <span>AYA</span>
            <span className="text-[8px] opacity-90">Pay</span>
          </div>
        </div>
      ),
    },
    {
      id: 'Cash at Terminal',
      name: 'Cash at Terminal',
      description: 'Pay cash at the bus departure terminal counter prior to boarding',
      tag: 'Counter',
      renderIcon: () => (
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 overflow-hidden relative p-1.5 shadow-2xs">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">
            storefront
          </span>
        </div>
      ),
    },
    {
      id: 'Cash on Boarding',
      name: 'Cash on Boarding',
      description: 'Pay cash directly to the bus conductor or driver upon boarding',
      tag: 'On Bus',
      renderIcon: () => (
        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 overflow-hidden relative p-1.5 shadow-2xs">
          <span className="material-symbols-outlined text-secondary dark:text-teal-400 text-2xl">
            directions_bus
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 pb-28 font-sans antialiased animate-fade-in">
      {/* Expired Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">timer_off</span>
            </div>
            <h3 className="text-xl font-bold text-primary dark:text-white">
              Seat Lock Expired
            </h3>
            <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
              Your 5-minute reservation hold for seat(s){' '}
              <span className="font-bold text-primary dark:text-white">
                {selectedSeats.join(', ')}
              </span>{' '}
              has ended. Seats have been freed for other passengers. Please re-select your seats to continue.
            </p>
            <button
              type="button"
              onClick={handleExpiredAcknowledge}
              className="w-full py-3.5 bg-secondary hover:bg-[#00504c] text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Return to Seat Selection
            </button>
          </div>
        </div>
      )}

      {/* Amount & 5-Minute Countdown Lock Header */}
      <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-[0px_4px_25px_rgba(26,43,72,0.06)] p-6 md:p-8 flex flex-col items-center justify-center text-center gap-1 border border-surface-container-high dark:border-slate-800 mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">
          Total Amount to Pay
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary dark:text-teal-300 tracking-tight my-1">
          {effectiveTotal.toLocaleString()} MMK
        </h2>

        {/* Selected Seats summary */}
        {selectedSeats.length > 0 && (
          <p className="text-xs font-medium text-on-surface-variant dark:text-slate-400">
            Holding Seats:{' '}
            <span className="font-bold text-primary dark:text-white">
              {selectedSeats.join(', ')}
            </span>
          </p>
        )}

        {/* Dynamic 5-Minute Seat Lock Timer with Progress Bar */}
        <div className="w-full mt-3 pt-3 border-t border-outline-variant/40 dark:border-slate-800 flex flex-col items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border transition-all ${
              isUrgent
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse'
                : isWarning
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-secondary-container/40 dark:bg-teal-950/60 text-secondary dark:text-teal-200 border-secondary/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {isUrgent ? 'alarm' : 'timer'}
            </span>
            <span>
              Seats locked for:{' '}
              <span className="font-mono text-sm tracking-wider font-extrabold">
                {formatTimer(timeLeft)}
              </span>
            </span>
          </div>

          {/* Time Progress Bar */}
          <div className="w-full max-w-xs h-1.5 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-secondary'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-[11px] text-on-surface-variant/80 dark:text-slate-400">
            Seats reserved exclusively for you during this window
          </span>
        </div>
      </section>

      {errorMessage && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container text-xs md:text-sm font-semibold rounded-xl flex items-start gap-2.5 border border-error/30 animate-shake">
          <span className="material-symbols-outlined text-lg text-error shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Payment Methods Section */}
      <form onSubmit={handleStartPayment} className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-primary dark:text-white">
            Select Payment Method
          </h3>
          <span className="text-xs font-semibold text-secondary dark:text-teal-400">
            6 Supported Options
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {paymentOptions.map((opt) => {
            const isSelected = selectedMethod === opt.id;
            return (
              <label key={opt.id} className="relative cursor-pointer group select-none">
                <input
                  type="radio"
                  name="payment_method"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => {
                    setSelectedMethod(opt.id);
                    setErrorMessage('');
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-full rounded-xl p-4 flex items-center justify-between transition-all border ${
                    isSelected
                      ? 'border-secondary bg-secondary-container/15 dark:bg-teal-950/40 shadow-xs ring-1 ring-secondary'
                      : 'bg-surface-container-lowest dark:bg-slate-900 border-outline-variant/60 dark:border-slate-800 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {opt.renderIcon()}
                    <div>
                      <div className="text-sm md:text-base font-bold text-primary dark:text-white flex items-center gap-1.5">
                        <span>{opt.name}</span>
                        <span className="text-[10px] bg-secondary text-white font-bold px-1.5 py-0.5 rounded-full">
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                      isSelected
                        ? 'border-secondary bg-secondary text-white'
                        : 'border-outline-variant'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Mobile Wallet Simulated Input */}
        {isMobileWallet && (
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-4 border border-outline-variant/40 dark:border-slate-800 space-y-2.5">
            <label className="block text-xs font-semibold text-primary dark:text-slate-300">
              Registered Wallet Phone Number ({selectedMethod}) *
            </label>
            <div className="flex items-center bg-surface-container-low dark:bg-slate-800 rounded-xl px-3 py-2 border border-outline-variant/60 dark:border-slate-700">
              <span className="material-symbols-outlined text-outline text-lg mr-2">phone_iphone</span>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="09XXXXXXXXX"
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-primary dark:text-white outline-none focus:ring-0"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant dark:text-slate-400">
              <span>Enter registered wallet mobile number</span>
              <button
                type="button"
                onClick={() => setSimulateDecline((prev) => !prev)}
                className={`text-[10px] font-semibold underline cursor-pointer ${
                  simulateDecline ? 'text-error font-bold' : 'text-secondary dark:text-teal-300'
                }`}
              >
                {simulateDecline ? 'Simulate Decline (Active)' : 'Test Payment Failure'}
              </button>
            </div>
          </div>
        )}

        {/* Cash instructions hint */}
        {!isMobileWallet && (
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-4 border border-outline-variant/40 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-secondary dark:text-teal-300">
              <span className="material-symbols-outlined text-base">info</span>
              <span>
                {selectedMethod === 'Cash at Terminal'
                  ? 'Terminal Cash Payment'
                  : 'On-Boarding Cash Payment'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {selectedMethod === 'Cash at Terminal'
                ? 'Your seat reservation will be confirmed immediately. Please pay the fare in cash at the bus station counter before boarding.'
                : 'Your seat reservation will be confirmed immediately. Please pay the exact fare directly to the bus conductor upon boarding.'}
            </p>
          </div>
        )}

        {/* Payment Confirmation CTA & Back Button */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={isProcessing || isVerifying || timeLeft <= 0}
            className="w-full py-4 bg-secondary hover:bg-[#00504c] text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Verifying Seat Availability...</span>
              </>
            ) : isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authorizing Transaction...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">lock</span>
                <span>
                  {selectedMethod === 'Cash at Terminal'
                    ? 'Confirm Reservation (Cash at Terminal)'
                    : selectedMethod === 'Cash on Boarding'
                    ? 'Confirm Reservation (Cash on Boarding)'
                    : `Pay ${effectiveTotal.toLocaleString()} MMK`}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancelAndBack}
            disabled={isProcessing || isVerifying}
            className="w-full py-3 border border-outline-variant rounded-xl text-xs md:text-sm font-semibold text-on-surface dark:text-slate-300 hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            Cancel & Return to Seat Selection
          </button>
        </div>
      </form>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-on-surface-variant dark:text-slate-500">
        <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
        <span>Direct ticketing & secure 5-minute reservation by Route X Bus System</span>
      </div>
    </div>
  );
};
