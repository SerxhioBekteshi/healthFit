import React from 'react';
import { FinalCta } from '@/components/landing/FinalCta';
import { Hero } from '@/components/landing/Hero';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNav } from '@/components/landing/LandingNav';
import { Manifesto } from '@/components/landing/Manifesto';
import { Marquee } from '@/components/landing/Marquee';
import { Principles } from '@/components/landing/Principles';
import { RoleTabs } from '@/components/landing/RoleTabs';
import { ScrollProgress } from '@/components/landing/ScrollProgress';
import { Showcase } from '@/components/landing/Showcase';

interface LandingPageProps {
  ctaHref: string;
  ctaLabel: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  ctaHref,
  ctaLabel,
}) => (
  <div className="landing relative min-h-screen font-sans antialiased">
    <ScrollProgress />
    <LandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} />
    <main className="relative z-10 mb-[78svh] overflow-x-clip rounded-b-[1.75rem] bg-ink shadow-[0_40px_100px_rgba(0,0,0,0.35)] md:rounded-b-[3rem]">
      <Hero ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <Marquee />
      <Manifesto />
      <Showcase />
      <Principles />
      <RoleTabs />
      <FinalCta ctaHref={ctaHref} ctaLabel={ctaLabel} />
    </main>
    <LandingFooter ctaHref={ctaHref} ctaLabel={ctaLabel} />
  </div>
);
