import React from 'react';
import { motion } from 'framer-motion';
import { AccentText } from '@/components/landing/AccentText';
import { ArrowIcon } from '@/components/landing/ArrowIcon';
import { FadeUp } from '@/components/landing/FadeUp';
import { RevealLines } from '@/components/landing/RevealLines';
import { EASE } from '@/components/landing/brand';

const PRINCIPLES = [
  {
    index: '01',
    title: 'Isolated by design.',
    body: 'Every gym lives in its own secure space. Data never crosses a boundary, and that is enforced on the server rather than only in the interface.',
  },
  {
    index: '02',
    title: 'Every cent accounted for.',
    body: 'Balances are built from an immutable ledger. Payments are confirmed by the server, never trusted to the screen.',
  },
  {
    index: '03',
    title: 'Respects the clock.',
    body: 'Opening hours, holidays and closures are understood per gym and per timezone before anyone walks through the door.',
  },
  {
    index: '04',
    title: 'Made for the floor.',
    body: 'Fast on a phone at the front desk, calm on a laptop in the office, and clear enough to need no manual.',
  },
];

export const Principles: React.FC = () => (
  <section
    id="principles"
    className="relative bg-ink px-5 py-[16vh] sm:px-8 md:px-14 md:py-[24vh]"
  >
    <div className="mx-auto max-w-[1400px]">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-20">
        <FadeUp className="flex items-start gap-4 text-[0.7rem] uppercase tracking-[0.22em] text-bone/50">
          <span className="mt-2 h-px w-10 bg-signal" />
          Principles
        </FadeUp>
        <RevealLines
          className="text-[clamp(2.2rem,5.6vw,5.2rem)] font-semibold leading-[1] tracking-[-0.04em] text-bone"
          lines={[
            'Built on four',
            <AccentText
              text="quiet convictions."
              className="font-display font-normal italic text-signal"
            />,
          ]}
        />
      </div>

      <ul className="mt-16 md:mt-28">
        {PRINCIPLES.map((item, index) => (
          <li key={item.index} className="group relative">
            <motion.span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px origin-left bg-white/15"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 1.2, ease: EASE, delay: index * 0.05 }}
            />
            <FadeUp delay={0.1}>
              <div className="grid gap-4 py-9 transition-colors duration-500 group-hover:bg-white/[0.025] md:grid-cols-[8rem_1.2fr_1fr] md:items-baseline md:gap-10 md:px-4 md:py-14">
                <span className="font-display text-2xl italic text-signal">
                  {item.index}
                </span>
                <h3 className="text-[clamp(1.7rem,3.4vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-bone transition-transform duration-500 ease-out md:group-hover:translate-x-3">
                  {item.title}
                </h3>
                <div className="flex items-start justify-between gap-6">
                  <p className="max-w-sm text-base leading-relaxed text-bone/60">
                    {item.body}
                  </p>
                  <span className="mt-1 hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 text-bone/60 transition-all duration-500 group-hover:border-signal group-hover:bg-signal group-hover:text-ink md:grid">
                    <ArrowIcon />
                  </span>
                </div>
              </div>
            </FadeUp>
          </li>
        ))}
        <li className="h-px bg-white/15" />
      </ul>
    </div>
  </section>
);
