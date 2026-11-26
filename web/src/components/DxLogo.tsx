import React from 'react';

interface DxLogoProps {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
}

/**
 * Exact web SVG recreation of app/src/main/res/drawable/ic_logo_mark.xml
 * paired with the DxLogo.kt typography lockup.
 */
export const DxLogo: React.FC<DxLogoProps> = ({ size = 40, showWordmark = true, subtitle }) => {
  return (
    <div className="inline-flex items-center gap-2 sm:gap-2.5 select-none shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 108 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Dasturxon Logo"
        className="shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient
            id="dxBreadGrad"
            x1="20"
            y1="20"
            x2="88"
            y2="88"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#F2B24C" />
            <stop offset="1" stopColor="#B7500A" />
          </linearGradient>
        </defs>
        {/* Outer Golden Bread Circle */}
        <circle cx="54" cy="54" r="42" fill="url(#dxBreadGrad)" />
        {/* Inner Crust Ring */}
        <circle cx="54" cy="54" r="30" stroke="#8B3300" strokeWidth="2.5" />
        {/* Center Chekich Pattern Dots */}
        <g fill="#3A1A00">
          <circle cx="54" cy="50" r="2" />
          <circle cx="54" cy="60" r="2" />
          <circle cx="49" cy="55" r="2" />
          <circle cx="59" cy="55" r="2" />
          <circle cx="45" cy="50.5" r="1.5" />
          <circle cx="63" cy="50.5" r="1.5" />
          <circle cx="45" cy="58.5" r="1.5" />
          <circle cx="63" cy="58.5" r="1.5" />
        </g>
        {/* Steam Curves */}
        <path
          d="M44 28 C42 22 48 18 46 14"
          stroke="#FFF8F1"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M54 26 C52 20 58 16 56 12"
          stroke="#FFF8F1"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M64 28 C62 22 68 18 66 14"
          stroke="#FFF8F1"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="font-display font-bold tracking-tight"
            style={{
              color: 'var(--dx-primary)',
              fontSize: `${Math.max(18, Math.round(size * 0.54))}px`,
            }}
          >
            Dasturxon
          </span>
          {subtitle && (
            <span
              className="hidden sm:block text-[11px] font-semibold tracking-wide uppercase mt-0.5 truncate"
              style={{ color: 'var(--dx-secondary)' }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
