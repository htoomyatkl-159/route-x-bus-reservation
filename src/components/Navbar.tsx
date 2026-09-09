import React, { useState, useRef, useEffect } from 'react';
import { ActiveScreen, User, ThemeMode, Booking } from '../types';
import { RouteXLogo } from './RouteXLogo';
import { useProfilePhoto } from '../data/photoStorage';
import { UserAvatar } from './UserAvatar';
import { getMembershipTier, countCompletedBookings } from '../utils/membership';

interface NavbarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  currentUser: User | null;
  bookings?: Booking[];
  completedBookingsCount?: number;
  onBack?: () => void;
  titleOverride?: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
  themeMode?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  bookings,
  completedBookingsCount,
  onBack,
  titleOverride,
  isDark,
  onToggleTheme,
  themeMode,
  onThemeChange,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentPhotoUrl = useProfilePhoto(currentUser);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [currentPhotoUrl]);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const effectiveIsDark =
    isDark !== undefined
      ? isDark
      : themeMode === 'dark' ||
        (themeMode === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggle = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else if (onThemeChange && themeMode) {
      const nextMode: ThemeMode = effectiveIsDark ? 'light' : 'dark';
      onThemeChange(nextMode);
    }
  };

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Booking Confirmed!',
      message: 'Your trip RX-98721 from Yangon to Mandalay is scheduled for tomorrow.',
      time: '10m ago',
      read: false,
    },
    {
      id: '2',
      title: 'Taunggyi Route Special',
      message: 'Get 10% off when booking Express Elite this weekend.',
      time: '2h ago',
      read: false,
    },
    {
      id: '3',
      title: 'Bus Terminal Update',
      message: 'Yangon departures from Aung Mingalar Gate 4.',
      time: '1d ago',
      read: true,
    },
  ]);

  const isTransactional = [
    'seat_selection',
    'passenger_info',
    'payment',
    'confirmation',
    'ticket',
  ].includes(currentScreen);

  // Suppress completely on Splash
  if (currentScreen === 'splash') return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Helper to get initials from user name
  const getUserInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'RX';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Calculate completed bookings count for current user
  const completedCount =
    typeof completedBookingsCount === 'number'
      ? completedBookingsCount
      : countCompletedBookings(bookings || [], currentUser?.id);

  // Dynamic membership tier based on completed bookings:
  // 0: New Member, 1-5: Silver Member, 6-10: Gold Member, 11+: Platinum Member
  const userTier = currentUser ? getMembershipTier(completedCount, currentUser) : null;
  const userInitials = currentUser ? getUserInitials(currentUser.name) : '';

  if (isTransactional) {
    let screenTitle = 'Route X';
    if (currentScreen === 'seat_selection') screenTitle = 'Seat Selection';
    if (currentScreen === 'passenger_info') screenTitle = 'Passenger Details';
    if (currentScreen === 'payment') screenTitle = 'Payment';
    if (currentScreen === 'confirmation') screenTitle = 'Booking Confirmed';
    if (currentScreen === 'ticket') screenTitle = 'Digital Ticket';
    if (titleOverride) screenTitle = titleOverride;

    return (
      <header className="sticky top-0 z-40 w-full bg-surface dark:bg-slate-900 border-b border-outline-variant dark:border-slate-800 transition-colors shadow-xs">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-5xl mx-auto">
          {onBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full text-primary dark:text-slate-200 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('home')}
              className="p-2 -ml-2 rounded-full text-primary dark:text-slate-200 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
          )}

          <h1 className="text-base md:text-lg font-bold text-primary dark:text-white text-center flex-1 truncate px-2">
            {screenTitle}
          </h1>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggle}
              aria-label="Toggle theme"
              className="p-2 rounded-full text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              <span className="material-symbols-outlined text-xl">
                {effectiveIsDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="p-2 -mr-2 rounded-full text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Home"
            >
              <span className="material-symbols-outlined text-xl">home</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-surface dark:bg-slate-900 border-b border-outline-variant/70 dark:border-slate-800 transition-colors shadow-xs">
      <div className="flex justify-between items-center px-4 md:px-8 h-16 max-w-7xl mx-auto">
        {/* Left: Brand Logo & Title ONLY (Duplicate avatar removed) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            aria-label="Route X Home"
          >
            <RouteXLogo size="sm" showText={false} />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary dark:text-white tracking-tight group-hover:text-secondary transition-colors">
                Route <span className="text-secondary dark:text-cyan-400">X</span>
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentScreen === 'home'
                ? 'bg-secondary-container dark:bg-teal-900/40 text-on-secondary-container dark:text-teal-300 font-semibold'
                : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('search_results')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentScreen === 'search_results'
                ? 'bg-secondary-container dark:bg-teal-900/40 text-on-secondary-container dark:text-teal-300 font-semibold'
                : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800'
            }`}
          >
            Find Buses
          </button>
          <button
            onClick={() => onNavigate('timetables')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentScreen === 'timetables'
                ? 'bg-secondary-container dark:bg-teal-900/40 text-on-secondary-container dark:text-teal-300 font-semibold'
                : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800'
            }`}
          >
            Timetables
          </button>
          <button
            onClick={() => onNavigate('help')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentScreen === 'help' || currentScreen === 'help_center'
                ? 'bg-secondary-container dark:bg-teal-900/40 text-on-secondary-container dark:text-teal-300 font-semibold'
                : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800'
            }`}
          >
            Help Center
          </button>
          <button
            onClick={() => onNavigate('my_bookings')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentScreen === 'my_bookings' || currentScreen === 'bookings'
                ? 'bg-secondary-container dark:bg-teal-900/40 text-on-secondary-container dark:text-teal-300 font-semibold'
                : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentScreen === 'profile'
                ? 'bg-secondary-container dark:bg-teal-900/40 text-on-secondary-container dark:text-teal-300 font-semibold'
                : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              currentScreen === 'admin'
                ? 'bg-primary dark:bg-cyan-600 text-white font-semibold'
                : 'text-secondary dark:text-cyan-400 bg-secondary-container/30 hover:bg-secondary-container/50'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            Admin Portal
          </button>
        </nav>

        {/* Right Section: Theme Toggle, Notifications, and Agoda-style User Badge */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Quick Button */}
          <button
            onClick={handleToggle}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={effectiveIsDark ? 'Light Mode' : 'Dark Mode'}
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {effectiveIsDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notification Button */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface dark:ring-slate-900 animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-xl border border-outline-variant dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-primary dark:text-white text-sm">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="bg-secondary-container text-on-secondary-container text-xs px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-secondary hover:underline font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-outline-variant/30 dark:divide-slate-800 max-h-72 overflow-y-auto no-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`py-3 transition-colors ${
                        !notif.read ? 'bg-secondary-container/10 -mx-2 px-2 rounded-lg' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-primary dark:text-white">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-on-surface-variant dark:text-slate-400">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-outline-variant/30 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('my_bookings');
                    }}
                    className="text-xs text-secondary dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                  >
                    View All Bookings →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Agoda-style User Badge / Auth Buttons */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              {/* DESKTOP VIEW: Full Agoda-style badge with Initials Circle + Full Name + Membership Tier */}
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="hidden md:flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-outline-variant/60 dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800/90 hover:border-secondary/50 dark:hover:border-teal-500/50 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs group text-left"
                aria-label="User profile and account menu"
              >
                {/* Profile Photo Image with Initials Fallback */}
                <UserAvatar
                  user={currentUser}
                  photoUrl={currentPhotoUrl}
                  size={48}
                  className="w-12 h-12 rounded-full ring-2 ring-white/80 dark:ring-slate-900 shadow-xs"
                  textClassName="text-[18px] font-bold"
                />

                {/* Name & Membership Tier */}
                <div className="flex flex-col min-w-0 pr-0.5">
                  <span className="text-xs font-bold text-primary dark:text-white truncate max-w-[120px] lg:max-w-[150px] leading-tight group-hover:text-secondary dark:group-hover:text-teal-300 transition-colors">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] font-semibold ${userTier?.textColor} flex items-center gap-0.5 leading-none mt-0.5`}>
                    <span className="material-symbols-outlined text-[11px] leading-none">
                      {userTier?.icon}
                    </span>
                    <span className="truncate">{userTier?.label}</span>
                  </span>
                </div>

                {/* Dropdown Indicator */}
                <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-base group-hover:text-primary dark:group-hover:text-white transition-colors">
                  {showUserMenu ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* MOBILE VIEW: Compact Profile Photo / Initials Circle Badge */}
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="md:hidden relative w-9 h-9 rounded-full shadow-xs ring-2 ring-white/80 dark:ring-slate-800 active:scale-95 cursor-pointer shrink-0 flex items-center justify-center"
                aria-label="User account"
                title={`${currentUser.name} (${userTier?.label})`}
              >
                <UserAvatar
                  user={currentUser}
                  photoUrl={currentPhotoUrl}
                  className="w-full h-full rounded-full"
                  textClassName="text-xs font-bold"
                />
                {/* Small membership tier star indicator */}
                <span
                  id="nav-mobile-tier-star"
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${userTier?.starColor || 'bg-secondary'} border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white leading-none z-10 pointer-events-none`}
                >
                  ★
                </span>
              </button>

              {/* User Account Popover Dropdown (Desktop & Mobile) */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-xl border border-outline-variant/80 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  {/* User Profile Header Card */}
                  <div className="p-3 bg-surface-container-low dark:bg-slate-800/80 rounded-xl mb-2 flex items-center gap-3">
                    <UserAvatar
                      user={currentUser}
                      photoUrl={currentPhotoUrl}
                      className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-xs"
                      textClassName="text-[18px] font-bold"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary dark:text-white truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate mb-1">
                        {currentUser.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span id="nav-dropdown-membership-badge" className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${userTier?.badgeBg}`}>
                          <span className="material-symbols-outlined text-[11px]">
                            {userTier?.icon}
                          </span>
                          {userTier?.label}
                        </span>
                        {currentUser.role !== 'admin' && (
                          <span className="text-[9px] text-on-surface-variant dark:text-slate-400 font-medium">
                            • {completedCount} {completedCount === 1 ? 'trip' : 'trips'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left font-medium text-primary dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-secondary dark:text-teal-400">
                        account_circle
                      </span>
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('my_bookings');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left font-medium text-primary dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-secondary dark:text-teal-400">
                        confirmation_number
                      </span>
                      <span>My Bookings</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('timetables');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left font-medium text-primary dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-secondary dark:text-teal-400">
                        schedule
                      </span>
                      <span>Bus Timetables</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('help');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left font-medium text-primary dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-secondary dark:text-teal-400">
                        support_agent
                      </span>
                      <span>Help Center</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('settings');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left font-medium text-primary dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-secondary dark:text-teal-400">
                        settings
                      </span>
                      <span>Settings</span>
                    </button>

                    {currentUser.role === 'admin' ? (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('admin');
                        }}
                        className="w-full px-3 py-2 rounded-lg text-left font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-amber-600">
                          admin_panel_settings
                        </span>
                        <span>Admin Dashboard</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('admin');
                        }}
                        className="w-full px-3 py-2 rounded-lg text-left font-medium text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-on-surface-variant">
                          admin_panel_settings
                        </span>
                        <span>Staff Admin Portal</span>
                      </button>
                    )}

                    <div className="border-t border-outline-variant/40 dark:border-slate-800 my-1 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onLogout) {
                            onLogout();
                          } else {
                            onNavigate('login');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg text-left font-medium text-error hover:bg-error-container/20 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-error">
                          logout
                        </span>
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-secondary dark:text-cyan-400 hover:bg-secondary-container/30 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold bg-secondary hover:bg-secondary-hover text-white shadow-xs transition-colors cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
