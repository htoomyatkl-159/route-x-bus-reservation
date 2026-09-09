import React, { useEffect } from 'react';
import { RouteXLogo } from './RouteXLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Auto proceed after 2.4 seconds if not clicked
    const timer = setTimeout(() => {
      onFinish();
    }, 2400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-50 bg-surface dark:bg-slate-950 text-on-surface flex flex-col justify-center items-center cursor-pointer select-none overflow-hidden"
    >
      {/* Subtle Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary-fixed/20 dark:bg-teal-900/20 blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary-container/30 dark:bg-teal-950/30 blur-[140px]"></div>
      </div>

      {/* Main Brand Content */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full px-6 z-10 animate-fade-in">
        {/* Animated Brand Emblem */}
        <div className="mb-6 transform hover:scale-105 transition-transform duration-500">
          <RouteXLogo size="xl" showText={false} />
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl md:text-5xl font-black text-primary dark:text-white tracking-tight mb-2 font-sans">
          ROUTE <span className="text-secondary dark:text-cyan-400">X</span>
        </h1>

        {/* Tagline */}
        <p className="text-base md:text-lg text-on-surface-variant dark:text-slate-300 font-medium tracking-wide">
          Smart Transport & Bus Reservation
        </p>

        {/* City network pill tags */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {['Yangon', 'Mandalay', 'Bago', 'Myeik', 'Taunggyi'].map((city) => (
            <span
              key={city}
              className="text-xs px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
            >
              {city}
            </span>
          ))}
        </div>

        {/* Touch to start indicator */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-outline dark:text-slate-400 tracking-wider uppercase font-semibold">
            Loading Route X...
          </span>
        </div>
      </div>
    </div>
  );
};
