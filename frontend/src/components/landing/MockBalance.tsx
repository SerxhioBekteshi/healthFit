import React from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/components/landing/brand';
import { TiltCard } from '@/components/landing/TiltCard';

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const formatDay = (date: string): string =>
  dayFormat.format(new Date(`${date}T00:00:00Z`));

const LEDGER = [
  {
    label: 'Balance deposit',
    method: 'Card',
    date: '2026-11-05',
    amount: '+10,000.00',
    positive: true,
  },
  {
    label: 'Membership: 4x per week',
    method: 'Client Balance',
    date: '2026-11-06',
    amount: '−4,000.00',
    positive: false,
  },
  {
    label: 'Protein shake',
    method: 'Client Balance',
    date: '2026-11-08',
    amount: '−450.00',
    positive: false,
  },
];

// Mirrors the member Balance page: available balance, then the transaction history.
export const MockBalance: React.FC = () => (
  <TiltCard className="w-full max-w-md">
    <p className="text-sm text-bone/55">Available balance</p>
    <p className="mt-2 text-4xl font-semibold leading-none tracking-tight tabular-nums text-signal">
      5,550.00
    </p>
    <p className="mt-3 text-sm text-bone/50">
      Spend it on memberships and products at your gym.
    </p>

    <div className="my-4 border-t border-white/10" />

    <p className="mb-1 text-base font-semibold text-bone">
      Transaction history
    </p>
    <ul className="divide-y divide-white/[0.06]">
      {LEDGER.map((row, index) => (
        <motion.li
          key={row.label}
          className="flex items-start justify-between gap-4 py-3.5"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 + index * 0.1 }}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-bone">{row.label}</p>
            <p className="mt-0.5 text-xs text-bone/50">
              {`${row.method} · ${formatDay(row.date)}`}
            </p>
          </div>
          <span
            className={`shrink-0 text-base font-bold tabular-nums ${
              row.positive ? 'text-signal' : 'text-danger'
            }`}
          >
            {row.amount}
          </span>
        </motion.li>
      ))}
    </ul>
  </TiltCard>
);
