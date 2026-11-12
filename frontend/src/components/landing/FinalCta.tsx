import React from 'react';
import { AccentText } from '@/components/landing/AccentText';
import { MagneticLink } from '@/components/landing/MagneticLink';
import { FadeUp } from '@/components/landing/FadeUp';
import { RevealLines } from '@/components/landing/RevealLines';

interface FinalCtaProps {
  ctaHref: string;
  ctaLabel: string;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ ctaHref, ctaLabel }) => (
  <section className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-ink px-5 py-[18vh] sm:px-8 md:px-14">
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      {[0, 1.05, 2.1].map((delay) => (
        <span
          key={delay}
          className="absolute left-1/2 top-1/2 block h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 animate-ping-slow rounded-full border border-signal/25 motion-reduce:animate-none"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 block h-[50vmin] w-[50vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/[0.08] blur-[100px]" />
    </div>

    <div className="relative z-10 mx-auto w-full max-w-[1400px]">
      <FadeUp className="mb-10 flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.22em] text-bone/50">
        <span className="h-px w-10 bg-signal" />
        Begin
      </FadeUp>

      <RevealLines
        className="text-[clamp(2.8rem,9.2vw,8.5rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-bone"
        lines={[
          'Ready when',
          <AccentText
            text="you are."
            as="em"
            className="font-display font-normal normal-case italic tracking-[-0.04em] text-signal"
          />,
        ]}
      />

      <FadeUp
        delay={0.3}
        className="mt-12 flex flex-wrap items-center gap-6 md:mt-16"
      >
        <MagneticLink href={ctaHref}>{ctaLabel}</MagneticLink>
        <p className="max-w-xs text-sm leading-relaxed text-bone/55">
          Sign in to your gym, or ask your platform owner to open one for you.
        </p>
      </FadeUp>
    </div>
  </section>
);
