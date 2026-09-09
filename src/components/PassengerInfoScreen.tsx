import React, { useState, useRef } from 'react';
import { TripSchedule, PassengerDetail, User } from '../types';

interface PassengerInfoScreenProps {
  trip: TripSchedule;
  selectedSeats: number[];
  totalPrice: number;
  currentUser: User | null;
  onProceedToPayment: (passengers: PassengerDetail[], contactPhone: string, contactEmail: string) => void;
  onBack: () => void;
}

export const PassengerInfoScreen: React.FC<PassengerInfoScreenProps> = ({
  trip,
  selectedSeats,
  totalPrice,
  currentUser,
  onProceedToPayment,
  onBack,
}) => {
  // Pre-fill name, phone, email ONLY from currentUser. NRC / Passport must always start blank.
  const [passengers, setPassengers] = useState<PassengerDetail[]>(
    selectedSeats.map((seatNum, idx) => ({
      seatNumber: seatNum,
      fullName: idx === 0 && currentUser ? currentUser.name : '',
      phone: idx === 0 && currentUser ? currentUser.phone : '',
      nrc: '',
      gender: 'Male',
    }))
  );

  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidFieldIds, setInvalidFieldIds] = useState<Set<string>>(new Set());

  const errorBannerRef = useRef<HTMLDivElement>(null);

  const updatePassenger = (seatNumber: number, field: keyof PassengerDetail, value: any) => {
    setPassengers((prev) =>
      prev.map((p) => (p.seatNumber === seatNumber ? { ...p, [field]: value } : p))
    );
    // Clear error for this field
    const fieldKey = `passenger-${seatNumber}-${field}`;
    if (invalidFieldIds.has(fieldKey)) {
      setInvalidFieldIds((prev) => {
        const next = new Set(prev);
        next.delete(fieldKey);
        return next;
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const newInvalid = new Set<string>();
    let firstInvalidElemId = '';

    // Validate each passenger
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName || !p.fullName.trim()) {
        const id = `input-passenger-${p.seatNumber}-name`;
        newInvalid.add(`passenger-${p.seatNumber}-fullName`);
        if (!firstInvalidElemId) firstInvalidElemId = id;
      }
      if (!p.phone || !p.phone.trim()) {
        const id = `input-passenger-${p.seatNumber}-phone`;
        newInvalid.add(`passenger-${p.seatNumber}-phone`);
        if (!firstInvalidElemId) firstInvalidElemId = id;
      }
    }

    // Validate contact info
    if (!contactEmail || !contactEmail.trim() || !contactEmail.includes('@')) {
      newInvalid.add('contactEmail');
      if (!firstInvalidElemId) firstInvalidElemId = 'input-contact-email';
    }

    if (!contactPhone || !contactPhone.trim()) {
      newInvalid.add('contactPhone');
      if (!firstInvalidElemId) firstInvalidElemId = 'input-contact-phone';
    }

    setInvalidFieldIds(newInvalid);

    if (newInvalid.size > 0) {
      setErrorMessage('Please fill in all required fields highlighted in red below.');
      if (firstInvalidElemId) {
        const elem = document.getElementById(firstInvalidElemId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          elem.focus();
        }
      } else if (errorBannerRef.current) {
        errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    onProceedToPayment(passengers, contactPhone, contactEmail);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 pb-32 font-sans animate-fade-in">
      {/* Route & Progress Header */}
      <div className="w-full bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-surface-container-high dark:border-slate-800 mb-6">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center max-w-xs mx-auto mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
          <div className="flex-1 h-0.5 bg-secondary"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
          <div className="flex-1 h-0.5 bg-secondary"></div>
          <div className="w-3 h-3 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
          <div className="flex-1 h-0.5 bg-surface-variant dark:bg-slate-700"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-surface-variant dark:bg-slate-700"></div>
        </div>

        <div className="flex flex-col md:row justify-between items-start md:items-center gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">
              Trip Details
            </span>
            <h2 className="text-base md:text-lg font-bold text-primary dark:text-white">
              {trip.fromCity} → {trip.toCity} ({trip.busName})
            </h2>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
              {trip.travelDate} • {trip.departureTime} • Seats: {selectedSeats.join(', ')}
            </p>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs text-on-surface-variant dark:text-slate-400">Total Payable:</span>
            <p className="text-lg md:text-xl font-bold text-primary dark:text-teal-300">
              {(totalPrice > 0 ? totalPrice : (selectedSeats.length || 1) * (trip.priceMMK || 35000)).toLocaleString()} MMK
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div
          ref={errorBannerRef}
          className="mb-6 p-4 bg-error-container text-on-error-container text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2.5 border border-error/30 animate-shake"
        >
          <span className="material-symbols-outlined text-lg text-error">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} noValidate className="space-y-6">
        {/* Passenger Cards */}
        {passengers.map((passenger, index) => {
          const isNameInvalid = invalidFieldIds.has(`passenger-${passenger.seatNumber}-fullName`);
          const isPhoneInvalid = invalidFieldIds.has(`passenger-${passenger.seatNumber}-phone`);

          return (
            <div
              key={passenger.seatNumber}
              className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/30 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-secondary text-white text-xs font-bold flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <h3 className="font-bold text-sm text-primary dark:text-white">
                    Passenger {index + 1}
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-secondary-container dark:bg-teal-950 text-secondary dark:text-teal-300 rounded-full text-xs font-bold">
                  Seat {passenger.seatNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label
                    htmlFor={`input-passenger-${passenger.seatNumber}-name`}
                    className={`block font-semibold mb-1.5 ${
                      isNameInvalid ? 'text-error dark:text-rose-400' : 'text-primary dark:text-slate-300'
                    }`}
                  >
                    Full Name *
                  </label>
                  <input
                    id={`input-passenger-${passenger.seatNumber}-name`}
                    type="text"
                    placeholder="e.g. Daw Aye Aye"
                    value={passenger.fullName}
                    onChange={(e) => updatePassenger(passenger.seatNumber, 'fullName', e.target.value)}
                    className={`w-full p-2.5 bg-surface dark:bg-slate-800 border rounded-xl text-primary dark:text-white outline-none transition-all ${
                      isNameInvalid
                        ? 'border-error ring-1 ring-error bg-error-container/10'
                        : 'border-outline-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                    }`}
                  />
                  {isNameInvalid && (
                    <p className="text-[11px] text-error dark:text-rose-400 mt-1 font-medium">
                      Full name is required for passenger {index + 1}.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`input-passenger-${passenger.seatNumber}-phone`}
                    className={`block font-semibold mb-1.5 ${
                      isPhoneInvalid ? 'text-error dark:text-rose-400' : 'text-primary dark:text-slate-300'
                    }`}
                  >
                    Phone Number *
                  </label>
                  <input
                    id={`input-passenger-${passenger.seatNumber}-phone`}
                    type="tel"
                    placeholder="09XXXXXXXXX"
                    value={passenger.phone}
                    onChange={(e) => updatePassenger(passenger.seatNumber, 'phone', e.target.value)}
                    className={`w-full p-2.5 bg-surface dark:bg-slate-800 border rounded-xl text-primary dark:text-white outline-none transition-all ${
                      isPhoneInvalid
                        ? 'border-error ring-1 ring-error bg-error-container/10'
                        : 'border-outline-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                    }`}
                  />
                  {isPhoneInvalid && (
                    <p className="text-[11px] text-error dark:text-rose-400 mt-1 font-medium">
                      Contact phone is required for passenger {index + 1}.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`input-passenger-${passenger.seatNumber}-nrc`}
                    className="block font-semibold text-primary dark:text-slate-300 mb-1.5"
                  >
                    NRC / Passport Number (Optional)
                  </label>
                  <input
                    id={`input-passenger-${passenger.seatNumber}-nrc`}
                    type="text"
                    placeholder="12/YAGANA(N)189283"
                    value={passenger.nrc || ''}
                    onChange={(e) => updatePassenger(passenger.seatNumber, 'nrc', e.target.value)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-primary dark:text-white outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-primary dark:text-slate-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={passenger.gender || 'Male'}
                    onChange={(e) => updatePassenger(passenger.seatNumber, 'gender', e.target.value as any)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-primary dark:text-white outline-none cursor-pointer focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {/* Primary Contact & Notification Details */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-4">
          <div className="border-b border-outline-variant/30 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-primary dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">contact_mail</span>
              <span>Contact & Delivery Info</span>
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
              E-tickets and confirmation receipts will be sent to this email and phone number.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label
                htmlFor="input-contact-email"
                className={`block font-semibold mb-1.5 ${
                  invalidFieldIds.has('contactEmail') ? 'text-error dark:text-rose-400' : 'text-primary dark:text-slate-300'
                }`}
              >
                Ticket Delivery Email *
              </label>
              <input
                id="input-contact-email"
                type="email"
                placeholder="passenger@example.com"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  if (invalidFieldIds.has('contactEmail')) {
                    setInvalidFieldIds((prev) => {
                      const next = new Set(prev);
                      next.delete('contactEmail');
                      return next;
                    });
                  }
                }}
                className={`w-full p-2.5 bg-surface dark:bg-slate-800 border rounded-xl text-primary dark:text-white outline-none transition-all ${
                  invalidFieldIds.has('contactEmail')
                    ? 'border-error ring-1 ring-error bg-error-container/10'
                    : 'border-outline-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                }`}
              />
              {invalidFieldIds.has('contactEmail') && (
                <p className="text-[11px] text-error dark:text-rose-400 mt-1 font-medium">
                  Please enter a valid email address.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-contact-phone"
                className={`block font-semibold mb-1.5 ${
                  invalidFieldIds.has('contactPhone') ? 'text-error dark:text-rose-400' : 'text-primary dark:text-slate-300'
                }`}
              >
                SMS Notification Phone *
              </label>
              <input
                id="input-contact-phone"
                type="tel"
                placeholder="09XXXXXXXXX"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  if (invalidFieldIds.has('contactPhone')) {
                    setInvalidFieldIds((prev) => {
                      const next = new Set(prev);
                      next.delete('contactPhone');
                      return next;
                    });
                  }
                }}
                className={`w-full p-2.5 bg-surface dark:bg-slate-800 border rounded-xl text-primary dark:text-white outline-none transition-all ${
                  invalidFieldIds.has('contactPhone')
                    ? 'border-error ring-1 ring-error bg-error-container/10'
                    : 'border-outline-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                }`}
              />
              {invalidFieldIds.has('contactPhone') && (
                <p className="text-[11px] text-error dark:text-rose-400 mt-1 font-medium">
                  Please enter a contact phone number.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs md:text-sm font-semibold text-on-surface dark:text-slate-300 hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-secondary hover:bg-[#00504c] text-white text-xs md:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Proceed to Payment</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
};
