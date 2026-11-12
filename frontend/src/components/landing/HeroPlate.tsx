import React from 'react';

const TICKS = Array.from({ length: 72 }, (_, index) => {
  const angle = (index * 5 * Math.PI) / 180;
  const major = index % 6 === 0;
  const inner = major ? 260 : 270;
  return {
    x1: (300 + Math.cos(angle) * inner).toFixed(2),
    y1: (300 + Math.sin(angle) * inner).toFixed(2),
    x2: (300 + Math.cos(angle) * 284).toFixed(2),
    y2: (300 + Math.sin(angle) * 284).toFixed(2),
    major,
  };
});

// A weight plate seen face-on: the brand object, drawn entirely in SVG.
export const HeroPlate: React.FC<{ label: string }> = ({ label }) => (
  <svg
    viewBox="0 0 600 600"
    className="h-auto w-full"
    role="img"
    aria-label="A weight plate"
  >
    <defs>
      <radialGradient id="plate-metal" cx="36%" cy="30%" r="85%">
        <stop offset="0" stopColor="#3b414b" />
        <stop offset="0.45" stopColor="#1b1e24" />
        <stop offset="1" stopColor="#08090c" />
      </radialGradient>
      <radialGradient id="plate-hole" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#d7ff3d" stopOpacity="0.55" />
        <stop offset="1" stopColor="#d7ff3d" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="plate-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <path
        id="plate-ring-path"
        d="M 300 300 m -232 0 a 232 232 0 1 1 464 0 a 232 232 0 1 1 -464 0"
      />
    </defs>

    <circle
      cx="300"
      cy="300"
      r="292"
      fill="url(#plate-metal)"
      stroke="rgba(255,255,255,0.14)"
      strokeWidth="1.5"
    />
    <g strokeLinecap="round">
      {TICKS.map((tick, index) => (
        <line
          key={index}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={tick.major ? '#d7ff3d' : 'rgba(255,255,255,0.22)'}
          strokeWidth={tick.major ? 2.4 : 1.2}
        />
      ))}
    </g>
    <circle
      cx="300"
      cy="300"
      r="252"
      fill="none"
      stroke="rgba(255,255,255,0.09)"
    />

    <g className="origin-center animate-spin-slow [transform-box:fill-box] motion-reduce:animate-none">
      <text
        fontSize="21"
        fontWeight="600"
        fill="rgba(243,239,231,0.6)"
        letterSpacing="9"
      >
        <textPath
          href="#plate-ring-path"
          textLength="1440"
          lengthAdjust="spacing"
        >
          {label}
        </textPath>
      </text>
    </g>

    <circle
      cx="300"
      cy="300"
      r="196"
      fill="#0b0d11"
      stroke="rgba(255,255,255,0.08)"
    />
    <circle
      cx="300"
      cy="300"
      r="172"
      fill="none"
      stroke="#d7ff3d"
      strokeOpacity="0.55"
      strokeWidth="1.4"
      strokeDasharray="1 9"
      strokeLinecap="round"
    />
    <text
      x="300"
      y="252"
      textAnchor="middle"
      fontSize="82"
      fontWeight="800"
      fill="#f3efe7"
      letterSpacing="-3"
    >
      20
    </text>
    <text
      x="300"
      y="398"
      textAnchor="middle"
      fontSize="20"
      fontWeight="700"
      fill="#d7ff3d"
      letterSpacing="16"
    >
      KG
    </text>

    <circle
      cx="300"
      cy="300"
      r="46"
      fill="#040506"
      stroke="rgba(255,255,255,0.14)"
      strokeWidth="1.5"
    />
    <circle cx="300" cy="300" r="46" fill="url(#plate-hole)" />
    <ellipse
      cx="215"
      cy="165"
      rx="200"
      ry="105"
      transform="rotate(-32 215 165)"
      fill="url(#plate-sheen)"
      opacity="0.55"
    />
  </svg>
);
