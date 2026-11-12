import React from 'react';
import { TiltCard } from '@/components/landing/TiltCard';

const GYMS = [
  {
    name: 'Alpha Gym',
    plan: 'Pro Monthly',
    status: 'Active',
    tone: 'active',
  },
  {
    name: 'Beta Fitness',
    plan: 'Basic Yearly',
    status: 'Past due',
    tone: 'due',
  },
  {
    name: 'Gamma Studio',
    plan: 'Pro Monthly',
    status: 'Paused',
    tone: 'paused',
  },
] as const;

const TONES = {
  active: 'bg-signal/15 text-signal',
  due: 'bg-danger/15 text-danger',
  paused: 'bg-white/10 text-bone/60',
};

// Mirrors the platform owner's view: gyms with their subscription status and revenue.
export const MockPlatform: React.FC = () => (
  <TiltCard className="w-full max-w-lg">
    <div className="flex items-center justify-between text-sm text-bone/55">
      <span>Platform</span>
      <span>3 gyms</span>
    </div>

    <ul className="mt-5 space-y-2.5">
      {GYMS.map((gym) => (
        <li
          key={gym.name}
          className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-ink/60 px-4 py-3.5"
        >
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-sm font-semibold text-bone">
              {gym.name.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-semibold text-bone">{gym.name}</p>
              <p className="text-xs text-bone/55">{gym.plan}</p>
            </div>
          </div>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${TONES[gym.tone]}`}
          >
            {gym.status}
          </span>
        </li>
      ))}
    </ul>

    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
      <div>
        <p className="text-xs text-bone/50">Platform revenue</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-bone">
          109,700 ALL
        </p>
      </div>
      <div>
        <p className="text-xs text-bone/50">Overdue</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-danger">
          89,900 ALL
        </p>
      </div>
    </div>
  </TiltCard>
);
