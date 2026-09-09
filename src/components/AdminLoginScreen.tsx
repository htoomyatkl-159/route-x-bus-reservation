import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../data/api';

interface AdminLoginScreenProps {
  onAdminLoginSuccess: (adminUser: User) => void;
  onReturnToPassengerApp: () => void;
  allUsers?: User[];
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onAdminLoginSuccess,
  onReturnToPassengerApp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Admin email is required');
      return;
    }
    if (!password) {
      setErrorMessage('Admin password is required');
      return;
    }

    setIsLoading(true);
    try {
      // Server-side admin verification and password check
      const { user } = await api.adminLogin({
        email: cleanEmail,
        password,
      });

      if (user.role !== 'admin') {
        setErrorMessage('Access denied. Administrator privileges required.');
        return;
      }

      onAdminLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid admin username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-8 text-on-background font-sans transition-colors">
      <main className="w-full max-w-md">
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-[0px_8px_30px_rgba(26,43,72,0.12)] p-6 md:p-8 w-full border border-surface-container-high dark:border-slate-800">
          {/* Admin Shield Badge */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary dark:bg-teal-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md rotate-3 hover:rotate-0 transition-transform">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary dark:text-teal-400">
                Route X System
              </span>
              <span className="text-[10px] bg-red-500/10 text-red-500 dark:text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/20">
                Restricted
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white text-center tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1.5 text-center leading-relaxed max-w-xs">
              Management & Operations Console for dispatchers, operators, and administrators
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-xl flex items-center gap-2 border border-error/30 animate-shake">
              <span className="material-symbols-outlined text-base text-error">lock</span>
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-primary dark:text-slate-200 mb-1.5"
                htmlFor="admin-email"
              >
                Admin Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-xl">
                  shield_person
                </span>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="admin@routex.com"
                  autoComplete="username"
                  className="w-full pl-10 pr-3 py-2.5 bg-surface dark:bg-slate-800 rounded-xl text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-outline-variant dark:placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider text-primary dark:text-slate-200 mb-1.5"
                htmlFor="admin-password"
              >
                Security Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-xl">
                  key
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface dark:bg-slate-800 rounded-xl text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-outline-variant dark:placeholder:text-slate-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 hover:text-primary dark:hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-secondary hover:bg-[#00504c] text-white text-sm md:text-base font-bold py-3.5 rounded-xl active:scale-98 transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Unlock Admin Console</span>
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-outline-variant/40 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onReturnToPassengerApp}
              className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 hover:text-secondary dark:hover:text-teal-300 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Return to Passenger App</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
