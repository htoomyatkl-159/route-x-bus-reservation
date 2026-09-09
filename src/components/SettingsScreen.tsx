import React, { useState } from 'react';
import { ThemeMode } from '../types';

interface SettingsScreenProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onResetData: () => void;
  onBack: () => void;
  onNavigateToHelp?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  themeMode,
  onThemeChange,
  onResetData,
  onBack,
  onNavigateToHelp,
}) => {
  const [notifications, setNotifications] = useState({
    bookingAlerts: true,
    smsReminder: true,
    promoOffers: false,
  });

  const [currency, setCurrency] = useState<'MMK' | 'USD'>('MMK');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-5 pb-28 md:pb-12 space-y-6 font-sans animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-primary dark:text-white hover:bg-surface-container-low dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-400">
            Customize your app appearance, preferences, and notifications
          </p>
        </div>
      </div>

      {/* Theme Appearance Setting */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">palette</span>
          <span>Theme & Appearance</span>
        </h2>
        <p className="text-xs text-on-surface-variant dark:text-slate-400">
          Choose how Route X looks on your screen
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { mode: 'light' as ThemeMode, label: 'Light', icon: 'light_mode' },
            { mode: 'dark' as ThemeMode, label: 'Dark', icon: 'dark_mode' },
            { mode: 'system' as ThemeMode, label: 'System', icon: 'devices' },
          ].map((tItem) => (
            <button
              key={tItem.mode}
              type="button"
              onClick={() => onThemeChange(tItem.mode)}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                themeMode === tItem.mode
                  ? 'border-secondary bg-secondary-container/20 dark:bg-teal-950 text-secondary dark:text-teal-300 font-bold shadow-xs'
                  : 'border-outline-variant/60 dark:border-slate-800 bg-surface dark:bg-slate-800/60 text-on-surface-variant dark:text-slate-400 hover:border-outline'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">{tItem.icon}</span>
              <span className="text-xs">{tItem.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Currency Preferences */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">payments</span>
          <span>Currency & Regional</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-slate-300 mb-1.5">
            Preferred Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'MMK' | 'USD')}
            className="w-full max-w-xs p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-sm text-primary dark:text-white outline-none cursor-pointer focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          >
            <option value="MMK">MMK (Myanmar Kyat - K)</option>
            <option value="USD">USD (US Dollar - $)</option>
          </select>
        </div>
      </div>

      {/* Notifications Preferences */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">notifications</span>
          <span>Notification Preferences</span>
        </h2>

        <div className="space-y-3 divide-y divide-outline-variant/20 dark:divide-slate-800">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-semibold text-primary dark:text-white">
                Booking Alerts
              </p>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Receive schedule changes, gate updates, and departure reminders
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.bookingAlerts}
              onChange={(e) =>
                setNotifications({ ...notifications, bookingAlerts: e.target.checked })
              }
              className="w-4 h-4 text-secondary rounded border-outline-variant focus:ring-secondary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-primary dark:text-white">
                SMS Travel Reminders
              </p>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Receive ticket QR codes and boarding pass details via SMS
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.smsReminder}
              onChange={(e) =>
                setNotifications({ ...notifications, smsReminder: e.target.checked })
              }
              className="w-4 h-4 text-secondary rounded border-outline-variant focus:ring-secondary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-primary dark:text-white">
                Promotional Offers
              </p>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Special holiday discounts, promo codes, and seasonal express routes
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.promoOffers}
              onChange={(e) =>
                setNotifications({ ...notifications, promoOffers: e.target.checked })
              }
              className="w-4 h-4 text-secondary rounded border-outline-variant focus:ring-secondary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Help & Support Quick Card */}
      {onNavigateToHelp && (
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">support_agent</span>
              <span>Help Center & Customer Support</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
              24/7 Helpline
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-slate-400">
            Have questions about your bus ticket, baggage, or refund policies? Call our 24/7 hotline at <strong className="text-primary dark:text-white">+95 9 789 000 123</strong> or browse FAQs.
          </p>
          <button
            type="button"
            onClick={onNavigateToHelp}
            className="px-4 py-2 bg-secondary hover:bg-[#00504c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            <span>Open Help Center</span>
          </button>
        </div>
      )}

      {/* Data & Storage Management */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-surface-container-high dark:border-slate-800 space-y-3">
        <h2 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">database</span>
          <span>Data & Storage</span>
        </h2>
        <p className="text-xs text-on-surface-variant dark:text-slate-400">
          Manage locally stored bookings and custom profile images
        </p>

        <button
          type="button"
          onClick={() => setResetModalOpen(true)}
          className="px-4 py-2 border border-error/40 text-error hover:bg-error-container/20 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          <span>Reset Sample Database</span>
        </button>
      </div>

      {/* App Version Info */}
      <div className="text-center text-xs text-on-surface-variant dark:text-slate-500 pt-2 space-y-1">
        <p className="font-semibold text-primary dark:text-slate-300">Route X Bus Reservation</p>
        <p>Version 2.4.0 (Build 2026.08)</p>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant dark:border-slate-800 text-center">
            <div className="w-14 h-14 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl">restart_alt</span>
            </div>
            <h3 className="text-base font-bold text-primary dark:text-white mb-1">
              Reset Application Data?
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-5">
              This will restore all default bus schedules, initial test bookings, and clear custom profile photos.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setResetModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-error hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
