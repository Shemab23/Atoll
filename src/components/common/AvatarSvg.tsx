import React from 'react';
import { Mask } from '../../types';

interface AvatarSvgProps {
  seed: Mask['avatarSeed'];
  size?: number;
  className?: string;
  isVerified?: boolean;
}

export const AvatarSvg: React.FC<AvatarSvgProps> = ({
  seed,
  size = 44,
  className = '',
  isVerified = false,
}) => {
  const { color, secondaryColor, shape, pattern } = seed;
  const idSuffix = React.useId().replace(/:/g, '');

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-full shadow-sm overflow-hidden"
      >
        <defs>
          <linearGradient id={`grad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>

          {/* Pattern defs */}
          {pattern === 'agaseke' && (
            <pattern id={`pat-${idSuffix}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0,10 L 10,0 L 20,10 L 10,20 Z" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.4)" />
            </pattern>
          )}

          {pattern === 'dots' && (
            <pattern id={`pat-${idSuffix}`} width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="2.5" fill="rgba(255,255,255,0.35)" />
            </pattern>
          )}

          {pattern === 'lines' && (
            <pattern id={`pat-${idSuffix}`} width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
            </pattern>
          )}

          {pattern === 'ripple' && (
            <pattern id={`pat-${idSuffix}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="8" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.3)" />
            </pattern>
          )}

          {pattern === 'sol' && (
            <pattern id={`pat-${idSuffix}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 12,0 L 12,24 M 0,12 L 24,12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <polygon points="12,6 18,12 12,18 6,12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            </pattern>
          )}
        </defs>

        {/* Base Background Shape */}
        {shape === 'circle' && (
          <circle cx="50" cy="50" r="48" fill={`url(#grad-${idSuffix})`} />
        )}
        {shape === 'polygon' && (
          <polygon points="50,4 96,26 96,74 50,96 4,74 4,26" fill={`url(#grad-${idSuffix})`} />
        )}
        {shape === 'diamond' && (
          <polygon points="50,6 94,50 50,94 6,50" fill={`url(#grad-${idSuffix})`} />
        )}
        {shape === 'island' && (
          <path
            d="M 50,6 C 75,4 94,22 92,48 C 90,74 72,92 48,94 C 24,96 6,78 8,50 C 10,24 25,8 50,6 Z"
            fill={`url(#grad-${idSuffix})`}
          />
        )}
        {shape === 'wave' && (
          <path
            d="M 50,6 C 85,12 94,40 88,68 C 82,90 60,94 40,90 C 16,84 8,62 12,38 C 16,14 30,2 50,6 Z"
            fill={`url(#grad-${idSuffix})`}
          />
        )}

        {/* Texture Overlay */}
        <rect x="0" y="0" width="100" height="100" fill={`url(#pat-${idSuffix})`} />

        {/* Mask Center Island Icon */}
        <g transform="translate(30, 30)">
          <path
            d="M 20,4 C 28,4 34,10 34,18 C 34,26 26,34 20,36 C 14,34 6,26 6,18 C 6,10 12,4 20,4 Z"
            fill="rgba(255,255,255,0.85)"
          />
          {/* Eye slits / Mask contours */}
          <ellipse cx="14" cy="18" rx="3.5" ry="2" fill={color} />
          <ellipse cx="26" cy="18" rx="3.5" ry="2" fill={color} />
          <path d="M 16,26 Q 20,29 24,26" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      </svg>

      {/* Blue Verified Shield for Shore Profiles */}
      {isVerified && (
        <span
          className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs"
          style={{ width: Math.max(16, size * 0.38), height: Math.max(16, size * 0.38) }}
          title="Verified ID (Rwanda Data Protection Law 2021)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </div>
  );
};
