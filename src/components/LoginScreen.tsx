import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../data/api';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToSignUp: () => void;
  allUsers?: User[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToSignUp,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await api.login({
        emailOrPhone: cleanInput,
        password,
      });

      if (user.role === 'admin') {
        setErrorMessage('This is an administrator account. Please use the Admin Portal.');
        return;
      }

      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-8 text-on-background font-sans transition-colors">
      <main className="w-full max-w-md">
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-[0px_4px_25px_rgba(26,43,72,0.08)] p-6 md:p-8 w-full border border-surface-container-high dark:border-slate-800">
          {/* Top Bus Icon Badge */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary-container dark:bg-teal-950 text-secondary-container rounded-full flex items-center justify-center mb-4 shadow-sm">
              <span
                className="material-symbols-outlined text-4xl text-teal-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                directions_bus
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white text-center tracking-tight">
              Passenger Login
            </h1>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1.5 text-center leading-relaxed">
              Sign in to manage your bookings and view tickets
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-lg flex items-center gap-2 border border-error/30 animate-shake">
              <span className="material-symbols-outlined text-base text-error">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label
                className="block text-sm font-medium text-primary dark:text-slate-200 mb-1"
                htmlFor="passenger-identity"
              >
                Email or Phone Number
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-xl">
                  person
                </span>
                <input
                  id="passenger-identity"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. aung@example.com or 0912345678"
                  autoComplete="username"
                  className="w-full pl-10 pr-3 py-2.5 bg-surface dark:bg-slate-800 rounded-lg text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-outline-variant dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-primary dark:text-slate-200 mb-1"
                htmlFor="passenger-password"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-xl">
                  lock
                </span>
                <input
                  id="passenger-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface dark:bg-slate-800 rounded-lg text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-outline-variant dark:placeholder:text-slate-500"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-outline-variant text-secondary focus:ring-secondary bg-surface dark:bg-slate-800 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-on-surface-variant dark:text-slate-400 group-hover:text-primary dark:group-hover:text-slate-200 transition-colors">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(identifier);
                  setShowForgotModal(true);
                }}
                className="text-xs font-semibold text-secondary dark:text-cyan-400 hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-secondary hover:bg-[#00504c] text-white text-base font-semibold py-3 rounded-lg active:scale-98 transition-all duration-200 shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Login</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-xs text-on-surface-variant dark:text-slate-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="text-secondary dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant dark:border-slate-800">
            <h3 className="text-lg font-bold text-primary dark:text-white mb-2">
              Reset Password
            </h3>
            {forgotSubmitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary mx-auto flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <p className="text-sm text-primary dark:text-white font-medium">
                  Reset link sent!
                </p>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
                  We've sent password reset instructions to {forgotEmail || 'your email'}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="mt-4 w-full bg-secondary text-white py-2 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-surface dark:bg-slate-800 rounded border border-outline-variant dark:border-slate-700 text-sm mb-4 text-primary dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 border border-outline-variant dark:border-slate-700 rounded-lg text-sm font-medium text-on-surface-variant dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotSubmitted(true)}
                    className="flex-1 py-2 bg-secondary text-white rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
