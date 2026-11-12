import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AccentText } from '@/components/landing/AccentText';
import { EASE } from '@/components/landing/brand';
import { FadeUp } from '@/components/landing/FadeUp';
import { MockDashboard } from '@/components/landing/MockDashboard';
import { MockPlatform } from '@/components/landing/MockPlatform';
import { MockQr } from '@/components/landing/MockQr';
import { RevealLines } from '@/components/landing/RevealLines';

interface Role {
  id: string;
  label: string;
  headline: string;
  points: string[];
  visual: React.ReactNode;
}

const ROLES: Role[] = [
  {
    id: 'member',
    label: 'Members',
    headline: 'Your gym, in your pocket.',
    points: [
      'A personal QR for instant check-in',
      'Membership, balance and history in one place',
      'Workout programs from your own gym',
      'Live occupancy before you leave home',
    ],
    visual: <MockQr />,
  },
  {
    id: 'team',
    label: 'Gym teams',
    headline: 'Run the floor without the friction.',
    points: [
      'Members, plans and renewals in a few taps',
      'Opening hours and closures that enforce themselves',
      'Stock, sales and balances that always add up',
      'A dashboard that shows what needs you today',
    ],
    visual: <MockDashboard />,
  },
  {
    id: 'platform',
    label: 'Platform owners',
    headline: 'Many gyms. One calm view.',
    points: [
      'Launch a new gym in minutes',
      'Subscriptions and payments per gym',
      'Pause a gym without touching its data',
      'Strict separation between every location',
    ],
    visual: <MockPlatform />,
  },
];

export const RoleTabs: React.FC = () => {
  const [active, setActive] = useState(0);
  const role = ROLES[active];

  return (
    <section
      id="platform"
      className="relative overflow-hidden bg-graphite px-5 py-[16vh] sm:px-8 md:px-14 md:py-[24vh]"
    >
      <div
        aria-hidden
        className="absolute -right-[20%] top-[10%] h-[60vh] w-[60vh] rounded-full bg-signal/[0.05] blur-[140px]"
      />
      <div className="relative mx-auto max-w-[1400px]">
        <FadeUp className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.22em] text-bone/50">
          <span className="h-px w-10 bg-signal" />
          One platform
        </FadeUp>
        <RevealLines
          className="mt-8 text-[clamp(2.2rem,5.6vw,5.2rem)] font-semibold leading-[1] tracking-[-0.04em] text-bone"
          lines={[
            'Built for everyone',
            <AccentText
              text="on the floor."
              className="font-display font-normal italic text-signal"
            />,
          ]}
        />

        <div
          role="tablist"
          aria-label="Choose a role"
          className="mt-12 inline-flex max-w-full flex-wrap gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-md md:mt-16"
        >
          {ROLES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active === index}
              onClick={() => setActive(index)}
              className={`relative rounded-full px-5 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 ${
                active === index ? 'text-ink' : 'text-bone/70 hover:text-bone'
              }`}
            >
              {active === index ? (
                <motion.span
                  layoutId="role-pill"
                  className="absolute inset-0 rounded-full bg-signal"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
              <span className="relative">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-14 min-h-[34rem] md:mt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={role.id}
              role="tabpanel"
              initial={{ opacity: 0, y: 36, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -24, filter: 'blur(10px)' }}
              transition={{ duration: 0.65, ease: EASE }}
              className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr] md:gap-24"
            >
              <div>
                <h3 className="text-[clamp(1.9rem,3.8vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-bone">
                  {role.headline}
                </h3>
                <ul className="mt-9 space-y-4">
                  {role.points.map((point, index) => (
                    <motion.li
                      key={point}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.6,
                        ease: EASE,
                        delay: 0.2 + index * 0.08,
                      }}
                      className="flex items-start gap-4 text-base text-bone/75 md:text-lg"
                    >
                      <span className="mt-2.5 h-px w-6 shrink-0 bg-signal" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center md:justify-end">
                {role.visual}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
