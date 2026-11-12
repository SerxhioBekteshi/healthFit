import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND, NAV_LINKS } from '@/components/landing/brand';

interface LandingFooterProps {
  ctaHref: string;
  ctaLabel: string;
}

// Fixed behind the page: the content above lifts away like a curtain to reveal it.
export const LandingFooter: React.FC<LandingFooterProps> = ({
  ctaHref,
  ctaLabel,
}) => (
  <footer className="fixed inset-x-0 bottom-0 z-0 flex h-[78svh] flex-col justify-between overflow-hidden bg-graphite px-5 pb-6 pt-16 sm:px-8 md:px-14">
    <div className="mx-auto grid w-full max-w-[1400px] gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
      <p className="max-w-sm text-lg leading-snug text-bone/70">
        {BRAND.descriptor}. Quietly precise software for the places where people
        get stronger.
      </p>
      <nav aria-label="Footer">
        <p className="mb-5 text-[0.68rem] uppercase tracking-[0.3em] text-bone/40">
          Explore
        </p>
        <ul className="space-y-3 text-sm text-bone/80">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="transition-colors hover:text-signal"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <p className="mb-5 text-[0.68rem] uppercase tracking-[0.3em] text-bone/40">
          Access
        </p>
        <Link
          to={ctaHref}
          className="text-sm text-bone/80 transition-colors hover:text-signal"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>

    <div>
      <p
        aria-hidden
        className="select-none text-center text-[clamp(3rem,15.5vw,16rem)] font-semibold uppercase leading-[0.78] tracking-[-0.05em] text-white/[0.05]"
      >
        {BRAND.name}
      </p>
      <p className="mt-6 flex flex-col justify-between gap-2 border-t border-white/10 pt-5 text-xs text-bone/40 sm:flex-row">
        <span>
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </span>
        <span>Interface previews use illustrative data.</span>
      </p>
    </div>
  </footer>
);
