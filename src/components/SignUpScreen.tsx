import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../data/api';

interface SignUpScreenProps {
  onSignUpSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUpSuccess,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms and Conditions');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await api.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      onSignUpSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-8 text-on-background font-sans transition-colors">
      <main className="w-full max-w-md">
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl shadow-[0px_4px_25px_rgba(26,43,72,0.08)] p-6 md:p-8 w-full border border-surface-container-high dark:border-slate-800">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-primary-container dark:bg-teal-950 text-secondary-container rounded-full flex items-center justify-center mb-3 shadow-sm">
              <span
                className="material-symbols-outlined text-3xl text-teal-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                person_add
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white text-center tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1 text-center">
              Join Route X for easy bus booking and ticket access
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-xs rounded-lg flex items-center gap-2 border border-error/30 animate-shake">
              <span className="material-symbols-outlined text-base text-error">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-primary dark:text-slate-200 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-lg">
                  badge
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Aung Aung"
                  className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-slate-800 rounded-lg text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-on-surface dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary dark:text-slate-200 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-lg">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-slate-800 rounded-lg text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-on-surface dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary dark:text-slate-200 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-lg">
                  phone_iphone
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="09XXXXXXXXX"
                  className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-slate-800 rounded-lg text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-on-surface dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary dark:text-slate-200 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-slate-800 rounded-lg text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-on-surface dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary dark:text-slate-200 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant dark:text-slate-500 text-lg">
                  lock_reset
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-slate-800 rounded-lg text-sm border border-surface-variant dark:border-slate-700 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-on-surface dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-outline-variant text-secondary focus:ring-secondary mt-0.5"
                />
                <span className="text-xs text-on-surface-variant dark:text-slate-400">
                  I agree to the{' '}
                  <span className="text-secondary dark:text-cyan-400 underline font-medium">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-secondary dark:text-cyan-400 underline font-medium">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-secondary hover:bg-[#00504c] text-white text-base font-semibold py-2.5 rounded-lg active:scale-98 transition-all duration-200 shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-xs text-on-surface-variant dark:text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-secondary dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              Login
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};
