import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { MockBalance } from '@/components/landing/MockBalance';
import { MockDashboard } from '@/components/landing/MockDashboard';
import { MockQr } from '@/components/landing/MockQr';
import { MockWorkout } from '@/components/landing/MockWorkout';
import { RevealLines } from '@/components/landing/RevealLines';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/media-query';
import { AccentText } from '@/components/landing/AccentText';

interface PanelData {
  index: string;
  kicker: string;
  title: string;
  body: string;
  mock: React.ReactNode;
}

const PANELS: PanelData[] = [
  {
    index: '01',
    kicker: 'Arrive',
    title: 'One scan.',
    body: 'A personal QR code is the whole front desk. Membership, opening hours and holidays are checked in a heartbeat.',
    mock: <MockQr />,
  },
  {
    index: '02',
    kicker: 'Train',
    title: 'Programs that fit.',
    body: 'Beginner to advanced plans, written by your coaches and always in the member’s pocket.',
    mock: <MockWorkout />,
  },
  {
    index: '03',
    kicker: 'Pay',
    title: 'Balance, clear as glass.',
    body: 'Top up, buy a shake, renew a plan. Every cent lands in an auditable ledger — never a mystery number.',
    mock: <MockBalance />,
  },
  {
    index: '04',
    kicker: 'Run',
    title: 'The floor at a glance.',
    body: 'Live occupancy, expiring memberships, revenue and stock in one calm dashboard.',
    mock: <MockDashboard />,
  },
];

// Panels are 76vw wide with a 4vw gap, so each step is 80vw.
const STEP_VW = 80;

interface PanelProps {
  panel: PanelData;
  index: number;
  progress: MotionValue<number>;
  desktop: boolean;
}

const ShowcasePanel: React.FC<PanelProps> = ({
  panel,
  index,
  progress,
  desktop,
}) => {
  const span = 1 / (PANELS.length - 1);
  const center = index * span;
  const first = index === 0;
  const last = index === PANELS.length - 1;
  // Scroll-linked ranges must stay within 0..1; the end panels hold their full state at the edge.
  const input = first
    ? [0, span]
    : last
      ? [1 - span, 1]
      : [center - span, center, center + span].map((value) =>
          Math.min(1, Math.max(0, value))
        );
  const opacity = useTransform(
    progress,
    input,
    first ? [1, 0.28] : last ? [0.28, 1] : [0.28, 1, 0.28]
  );
  const scale = useTransform(
    progress,
    input,
    first ? [1, 0.93] : last ? [0.93, 1] : [0.93, 1, 0.93]
  );

  return (
    <motion.article
      style={desktop ? { opacity, scale } : undefined}
      className={
        desktop
          ? 'grid h-[72vh] w-[76vw] shrink-0 grid-cols-[1fr_1.05fr] items-center gap-[5vw]'
          : 'grid gap-10'
      }
    >
      <div>
        <p className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.3em] text-bone/55">
          <span className="font-display text-lg normal-case italic tracking-normal text-signal">
            {panel.index}
          </span>
          {panel.kicker}
        </p>
        <h3 className="mt-5 text-[clamp(2.5rem,5.2vw,5.4rem)] font-semibold leading-[1] tracking-[-0.04em] text-bone">
          {panel.title}
        </h3>
        <p className="mt-6 max-w-md text-base leading-relaxed text-bone/65 md:text-lg">
          {panel.body}
        </p>
      </div>
      <div className="flex justify-center md:justify-end">{panel.mock}</div>
    </motion.article>
  );
};

export const Showcase: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery('(min-width: 768px)');
  const reduced = usePrefersReducedMotion();
  const desktop = wide && !reduced;
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ['0vw', `-${(PANELS.length - 1) * STEP_VW}vw`]
  );

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.round(value * (PANELS.length - 1)));
  });

  return (
    <section id="experience" className="relative bg-graphite">
      <div
        ref={ref}
        className={
          desktop ? 'relative h-[430vh]' : 'relative px-5 py-[16vh] sm:px-8'
        }
      >
        <div
          className={
            desktop
              ? 'sticky top-0 h-screen overflow-hidden'
              : 'mx-auto max-w-xl'
          }
        >
          <div
            className={
              desktop
                ? 'absolute inset-x-0 top-[13vh] z-10 flex items-end justify-between px-[12vw]'
                : 'mb-14'
            }
          >
            <RevealLines
              className="text-[clamp(1.1rem,1.6vw,1.5rem)] font-medium uppercase tracking-[0.28em] text-bone/70"
              as="h2"
              lines={[
                <AccentText
                  text="Four moments, one flow"
                  words={2}
                  className="font-display normal-case italic tracking-normal text-signal"
                />,
              ]}
            />
            {desktop ? (
              <p className="font-display text-xl italic text-bone/60">
                <span className="text-bone">0{active + 1}</span> / 0
                {PANELS.length}
              </p>
            ) : null}
          </div>

          <motion.div
            style={desktop ? { x } : undefined}
            className={
              desktop
                ? 'flex h-full items-center gap-[4vw] pl-[12vw] pr-[12vw] pt-[8vh]'
                : 'flex flex-col gap-24'
            }
          >
            {PANELS.map((panel, index) => (
              <ShowcasePanel
                key={panel.index}
                panel={panel}
                index={index}
                progress={scrollYProgress}
                desktop={desktop}
              />
            ))}
          </motion.div>

          {desktop ? (
            <div className="absolute inset-x-[12vw] bottom-[8vh] h-px bg-white/10">
              <motion.div
                className="h-full origin-left bg-signal"
                style={{ scaleX: scrollYProgress }}
              />
            </div>
          ) : null}

          {!desktop ? null : (
            <p className="absolute bottom-[3.2vh] right-[12vw] text-[0.65rem] uppercase tracking-[0.22em] text-bone/35">
              Interface previews use illustrative data
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
