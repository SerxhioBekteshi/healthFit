import React from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/components/landing/brand';
import { TiltCard } from '@/components/landing/TiltCard';

const TILES = [
  { label: 'Inside now', value: '12' },
  { label: 'Active members', value: '248' },
  { label: 'This month', value: '840k ALL' },
];

// Monday to Sunday.
const DAYS = [38, 52, 44, 68, 92, 74, 41];

const weekdayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'narrow',
  timeZone: 'UTC',
});

const weekdayInitial = (index: number): string =>
  weekdayFormat.format(new Date(Date.UTC(2026, 10, 2 + index)));

// Mirrors the gym dashboard: stat tiles, the week's visits and what needs attention.
export const MockDashboard: React.FC = () => (
  <TiltCard className="w-full max-w-lg">
    <div className="flex items-center justify-between text-sm text-bone/55">
      <span>Today on the floor</span>
      <span className="flex items-center gap-2 text-signal">
        <span className="h-1.5 w-1.5 rounded-full bg-signal" />
        Live
      </span>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-3">
      {TILES.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl border border-white/[0.08] bg-ink/60 p-3.5"
        >
          <p className="text-xs text-bone/50">{tile.label}</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-bone">
            {tile.value}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-4 flex h-36 items-end gap-3 rounded-xl border border-white/[0.08] bg-ink/60 px-4 pb-4 pt-6">
      {DAYS.map((height, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-full w-full items-end">
            <motion.div
              className={`w-full origin-bottom rounded-t-md ${
                index === 4 ? 'bg-signal' : 'bg-white/15'
              }`}
              style={{ height: `${height}%` }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 1,
                ease: EASE,
                delay: 0.2 + index * 0.07,
              }}
            />
          </div>
          <span className="text-[0.62rem] text-bone/50">
            {weekdayInitial(index)}
          </span>
        </div>
      ))}
    </div>

    <p className="mt-4 text-xs text-bone/50">
      3 memberships expire this week · 1 product low on stock
    </p>
  </TiltCard>
);
