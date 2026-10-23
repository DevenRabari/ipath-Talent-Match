import React from 'react';

interface IpathLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const IpathLogo: React.FC<IpathLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official iPath Infotech Emblem SVG */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-1 shadow-sm border border-slate-700/30"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="ipathGradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="ipathGradientPath" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>

          {/* Dynamic Connected Path Loop */}
          <path
            d="M20 72 C 20 40, 42 24, 72 24 C 84 24, 88 32, 82 42 C 76 52, 60 56, 44 60 C 28 64, 22 76, 32 82 C 40 86, 68 84, 84 68"
            stroke="url(#ipathGradientPath)"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Stylized lower-case 'i' dot */}
          <circle cx="34" cy="24" r="6.5" fill="#38BDF8" />

          {/* Orbiting Tech Node Accent */}
          <circle cx="78" cy="30" r="3.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="28" cy="74" r="3.5" fill="#38BDF8" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 leading-none flex-wrap sm:flex-nowrap">
          {/* iPath Infotech Wordmark - Prominent Highlight */}
          <div className="flex items-center">
            <span className="font-['Plus_Jakarta_Sans'] font-black tracking-tight text-slate-900 text-xl flex items-baseline">
              <span className="text-sky-500 font-black drop-shadow-xs">i</span>
              <span className="text-slate-900">Path</span>
            </span>
            <span className="ml-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
              Infotech
            </span>
          </div>

          <span className="hidden sm:inline text-slate-300 font-light mx-0.5">|</span>

          {/* Product Name */}
          <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-blue-700 text-base tracking-tight flex items-center gap-1.5">
            <span>Talent Match</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10.5px] font-semibold text-slate-500 tracking-normal">
              Empowering Innovation, Enabling Success • Enterprise AI Screening
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
