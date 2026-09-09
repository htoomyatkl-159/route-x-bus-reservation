import React from 'react';
import { ActiveScreen } from '../types';

interface BottomNavProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  activeBookingsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, activeBookingsCount }) => {
  // Hide bottom nav on splash & transactional checkout screens
  const hideOnScreens: ActiveScreen[] = [
    'splash',
    'login',
    'signup',
    'seat_selection',
    'passenger_info',
    'payment',
    'confirmation',
    'ticket',
  ];

  if (hideOnScreens.includes(currentScreen)) {
    return null;
  }

  const navItems = [
    {
      id: 'home' as ActiveScreen,
      label: 'Home',
      icon: 'home',
    },
    {
      id: 'search_results' as ActiveScreen,
      label: 'Find Buses',
      icon: 'search',
    },
    {
      id: 'my_bookings' as ActiveScreen,
      label: 'My Bookings',
      icon: 'confirmation_number',
      badge: activeBookingsCount,
    },
    {
      id: 'profile' as ActiveScreen,
      label: 'Profile',
      icon: 'person',
    },
  ];

  const isActive = (itemScreen: ActiveScreen) => {
    if (itemScreen === 'home' && currentScreen === 'home') return true;
    if (itemScreen === 'search_results' && currentScreen === 'search_results') return true;
    if (itemScreen === 'my_bookings' && (currentScreen === 'my_bookings' || currentScreen === 'bookings')) return true;
    if (itemScreen === 'profile' && (currentScreen === 'profile' || currentScreen === 'settings')) return true;
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 py-2 pb-safe bg-surface dark:bg-slate-900 border-t border-outline-variant/50 dark:border-slate-800 shadow-[0px_-4px_20px_rgba(26,43,72,0.06)] rounded-t-2xl">
      {navItems.map((item) => {
        const active = isActive(item.id);
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
              active
                ? 'bg-secondary-container dark:bg-teal-900/60 text-on-secondary-container dark:text-teal-200 rounded-full px-3.5 py-1.5 scale-98 shadow-xs'
                : 'text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-white px-2.5 py-1 scale-95'
            }`}
            aria-label={item.label}
          >
            <div className="relative">
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-secondary text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className={`text-[10.5px] mt-0.5 whitespace-nowrap ${active ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
