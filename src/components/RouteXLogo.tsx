import React from 'react';

interface RouteXLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const RouteXLogo: React.FC<RouteXLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-32 h-32 md:w-44 md:h-44',
  };

  const textClasses = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-extrabold',
    xl: 'text-3xl md:text-4xl font-extrabold tracking-tight',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Route X Emblem Icon */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-white dark:bg-slate-800 shadow-sm border border-teal-500/30 flex items-center justify-center p-1 relative overflow-hidden shrink-0`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Circular border */}
          <circle cx="50" cy="50" r="46" stroke="#006a65" strokeWidth="3" strokeDasharray="6 2" opacity="0.4" />
          <circle cx="50" cy="50" r="43" stroke="#031632" strokeWidth="2.5" />
          
          {/* Dynamic 'X' Roadway */}
          <path
            d="M25 30 L45 50 L25 70"
            stroke="#031632"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M75 30 L55 50 L75 70"
            stroke="#006a65"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Bus Silhouette on Swoosh */}
          <path
            d="M30 68 C40 50, 60 40, 78 32"
            stroke="#76f3ea"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <g transform="translate(42, 28) rotate(-15) scale(0.6)">
            {/* Bus body */}
            <rect x="0" y="0" width="46" height="24" rx="6" fill="#006a65" />
            <rect x="5" y="4" width="12" height="9" rx="2" fill="#ffffff" />
            <rect x="20" y="4" width="10" height="9" rx="2" fill="#ffffff" />
            <rect x="33" y="4" width="9" height="9" rx="2" fill="#ffffff" />
            {/* Bus wheels */}
            <circle cx="10" cy="24" r="5" fill="#031632" />
            <circle cx="10" cy="24" r="2" fill="#ffffff" />
            <circle cx="36" cy="24" r="5" fill="#031632" />
            <circle cx="36" cy="24" r="2" fill="#ffffff" />
            {/* Headlights */}
            <circle cx="43" cy="17" r="2" fill="#76f3ea" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textClasses[size]} text-primary dark:text-teal-300 font-sans tracking-tight`}>
            Route <span className="text-secondary dark:text-cyan-400">X</span>
          </span>
          {size === 'xl' && (
            <span className="text-xs uppercase tracking-widest text-on-surface-variant dark:text-slate-400 font-semibold mt-0.5">
              Transport
            </span>
          )}
        </div>
      )}
    </div>
  );
};
