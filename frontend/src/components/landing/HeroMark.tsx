import React from 'react';
import { BRAND } from '@/components/landing/brand';

// The HealthFIT logo, enlarged: a heart with a heartbeat line, soft ripples around it.
export const HeroMark: React.FC = () => (
  <svg
    viewBox="0 0 600 600"
    className="h-auto w-full"
    role="img"
    aria-label={`The ${BRAND.name} heart mark`}
  >
    <defs>
      <radialGradient id="mark-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0" style={{ stopColor: 'rgb(var(--c-signal) / 0.28)' }} />
        <stop offset="1" style={{ stopColor: 'rgb(var(--c-signal) / 0)' }} />
      </radialGradient>
      <linearGradient id="mark-signal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: 'rgb(var(--c-signal))' }} />
        <stop offset="1" style={{ stopColor: 'rgb(var(--c-signal) / 0.7)' }} />
      </linearGradient>
    </defs>

    <circle cx="300" cy="300" r="290" fill="url(#mark-glow)" />
    <circle
      cx="300"
      cy="300"
      r="236"
      fill="none"
      className="stroke-white/10"
      strokeWidth="1.5"
    />

    <g className="animate-float motion-reduce:animate-none">
      {[0, 1.6].map((delay) => (
        <circle
          key={delay}
          cx="300"
          cy="296"
          r="150"
          fill="none"
          className="origin-center animate-ping-slow stroke-signal/30 [transform-box:fill-box] motion-reduce:animate-none"
          strokeWidth="2"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <g transform="translate(124 112) scale(11)">
        <path
          d="M16 28.2C7.6 21.7 3 17.2 3 11.7 3 7.7 5.9 5 9.6 5c2.6 0 4.8 1.4 6.4 3.6C17.6 6.4 19.8 5 22.4 5 26.1 5 29 7.7 29 11.7c0 5.5-4.6 10-13 16.5z"
          fill="url(#mark-signal)"
        />
        <path
          d="M5.5 15.2h5.6l2.3-4.4 3.5 9.2 2.6-4.8H26.5"
          fill="none"
          className="stroke-ink"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>

    <circle cx="474" cy="436" r="14" className="fill-signal" opacity="0.7" />
    <circle cx="116" cy="500" r="7" className="fill-bone" opacity="0.4" />
    <circle cx="510" cy="130" r="9" className="fill-bone" opacity="0.35" />
  </svg>
);
