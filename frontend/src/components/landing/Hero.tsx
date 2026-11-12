import React, { useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { AccentText } from '@/components/landing/AccentText';
import { BRAND } from '@/components/landing/brand';
import { FadeUp } from '@/components/landing/FadeUp';
import { HeroChip } from '@/components/landing/HeroChip';
import { HeroMark } from '@/components/landing/HeroMark';
import { MagneticLink } from '@/components/landing/MagneticLink';
import { RevealLines } from '@/components/landing/RevealLines';
import { usePrefersReducedMotion } from '@/hooks/media-query';

interface HeroProps {
  ctaHref: string;
  ctaLabel: string;
}

export const Hero: React.FC<HeroProps> = ({ ctaHref, ctaLabel }) => {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const markY = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', reduced ? '0%' : '14%']
  );
  const markScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, reduced ? 1 : 1.12]
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', reduced ? '0%' : '-12%']
  );
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.72],
    [1, reduced ? 1 : 0]
  );

  const pointerX = useMotionValue(72);
  const pointerY = useMotionValue(34);
  const spotX = useSpring(pointerX, { stiffness: 70, damping: 18 });
  const spotY = useSpring(pointerY, { stiffness: 70, damping: 18 });
  const spotlight = useMotionTemplate`radial-gradient(640px circle at ${spotX}% ${spotY}%, rgb(var(--c-signal) / 0.1), transparent 62%)`;

  const onPointerMove = (event: React.PointerEvent<HTMLElement>): void => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 100);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className="grain relative min-h-[100svh] overflow-hidden bg-ink"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: spotlight }}
      />
      <div
        aria-hidden
        className="absolute -left-[30%] -top-[25%] h-[80vh] w-[80vh] rounded-full bg-signal/[0.07] blur-[150px]"
      />
      <div
        aria-hidden
        className="absolute -right-[20%] top-0 h-[130%] w-[45%] rotate-[14deg] bg-gradient-to-b from-white/[0.05] via-white/[0.015] to-transparent blur-3xl"
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-[30vw] top-[14svh] w-[100vw] max-w-none opacity-60 sm:-right-[18vw] sm:w-[70vw] md:-right-[6vw] md:top-[10svh] md:w-[48vw] md:opacity-100"
        style={{ y: markY, scale: markScale }}
      >
        <HeroMark />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-[5] hidden md:block">
        <HeroChip className="right-[43%] top-[27%]" delay="0s" dot>
          Checked in
        </HeroChip>
        <HeroChip className="right-[6%] top-[58%]" delay="-2.4s">
          Balance 5,550 ALL
        </HeroChip>
        <HeroChip className="right-[33%] top-[70%]" delay="-4.6s">
          6 day streak
        </HeroChip>
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-[6] h-2/5 bg-gradient-to-t from-ink via-ink/80 to-transparent"
      />

      <motion.div
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1500px] flex-col justify-end px-5 pb-10 pt-32 sm:px-8 md:px-14 md:pb-14"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <FadeUp immediate delay={0.2} className="mb-8 md:mb-10">
          <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.72rem] font-medium tracking-[0.08em] text-bone/80 backdrop-blur-md sm:text-[0.78rem]">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            {BRAND.descriptor}
          </span>
        </FadeUp>

        <RevealLines
          as="h1"
          immediate
          delay={0.3}
          className="text-[clamp(3rem,10.6vw,9.5rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-bone"
          lines={[
            'Train like',
            <AccentText
              text="it matters."
              as="em"
              className="font-display font-normal normal-case italic tracking-[-0.04em] text-signal"
            />,
          ]}
        />

        <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
          <FadeUp immediate delay={0.9} className="max-w-md">
            <p className="text-base leading-relaxed text-bone/70 md:text-lg">
              One membership, one scan, one beautifully calm app. Made for the
              people who train and the teams who run the floor.
            </p>
          </FadeUp>

          <FadeUp
            immediate
            delay={1.05}
            className="flex flex-wrap items-center gap-3"
          >
            <MagneticLink href={ctaHref}>{ctaLabel}</MagneticLink>
            <MagneticLink href="#experience" variant="ghost">
              See how it works
            </MagneticLink>
          </FadeUp>
        </div>

        <FadeUp immediate delay={1.3} className="mt-12 hidden md:block">
          <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.22em] text-bone/50">
            <span className="relative block h-12 w-px overflow-hidden bg-white/15">
              <span className="absolute inset-x-0 top-0 h-full animate-scroll-cue bg-signal motion-reduce:animate-none" />
            </span>
            Scroll
          </div>
        </FadeUp>
      </motion.div>
    </section>
  );
};
