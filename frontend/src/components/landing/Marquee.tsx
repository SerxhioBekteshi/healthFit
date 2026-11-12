import React from 'react';

const ITEMS = [
  'QR check-in',
  'Memberships',
  'Live occupancy',
  'Workout programs',
  'Ledger-backed balances',
  'Multi-gym',
];

export const Marquee: React.FC = () => (
  <div
    aria-hidden
    className="group relative overflow-hidden border-y border-white/10 bg-ink py-7 md:py-9"
  >
    <div className="flex w-max animate-marquee items-center motion-reduce:animate-none group-hover:[animation-play-state:paused]">
      {[0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0 items-center">
          {ITEMS.map((item) => (
            <span key={item} className="flex items-center">
              <span className="text-stroke px-8 text-[clamp(2rem,5.4vw,4.6rem)] font-semibold leading-none tracking-[-0.03em] transition-colors duration-500 hover:!text-bone md:px-12">
                {item}
              </span>
              <span className="font-display text-3xl italic text-signal">
                ✦
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);
