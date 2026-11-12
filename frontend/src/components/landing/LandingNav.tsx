import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion';
import { BRAND, EASE, NAV_LINKS } from '@/components/landing/brand';
import { MagneticLink } from '@/components/landing/MagneticLink';
import { Wordmark } from '@/components/landing/Wordmark';
import { BrandName } from '@/components/ui/BrandName';

interface LandingNavProps {
  ctaHref: string;
  ctaLabel: string;
}

const menuItem = {
  closed: { y: 48, opacity: 0 },
  open: { y: 0, opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

export const LandingNav: React.FC<LandingNavProps> = ({
  ctaHref,
  ctaLabel,
}) => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 24);
    setHidden(latest > previous && latest > 140);
  });

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled || open
            ? 'border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
        animate={{ y: hidden && !open ? '-110%' : '0%' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-[1500px] items-center justify-between px-5 sm:px-8 md:px-14">
          <Link
            to="/"
            aria-label={`${BRAND.name} home`}
            className="relative z-[60] flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <Wordmark />
            <BrandName className="text-xl" />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-10 md:flex"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative py-2 text-[0.78rem] font-medium uppercase tracking-[0.2em] text-bone/70 transition-colors hover:text-bone"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-signal transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100" />
              </a>
            ))}
            <Link
              to={ctaHref}
              className="rounded-full border border-white/20 px-5 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-bone transition-colors duration-300 hover:border-signal hover:bg-signal hover:text-ink"
            >
              {ctaLabel}
            </Link>
          </nav>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="relative z-[60] h-11 w-11 rounded-full border border-white/15 md:hidden"
          >
            <motion.span
              className="absolute left-1/2 top-1/2 block h-px w-5 -translate-x-1/2 bg-bone"
              animate={{ rotate: open ? 45 : 0, y: open ? 0 : -4 }}
              transition={{ duration: 0.4, ease: EASE }}
            />
            <motion.span
              className="absolute left-1/2 top-1/2 block h-px w-5 -translate-x-1/2 bg-bone"
              animate={{ rotate: open ? -45 : 0, y: open ? 0 : 4 }}
              transition={{ duration: 0.4, ease: EASE }}
            />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu"
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ink px-6 pb-10 pt-28 md:hidden"
            initial={{ clipPath: 'circle(0% at 90% 5%)' }}
            animate={{ clipPath: 'circle(150% at 90% 5%)' }}
            exit={{ clipPath: 'circle(0% at 90% 5%)' }}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <motion.nav
              aria-label="Mobile"
              className="flex flex-col gap-3"
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: { staggerChildren: 0.08, delayChildren: 0.3 },
                },
              }}
            >
              {NAV_LINKS.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  variants={menuItem}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-b border-white/10 py-4 text-[2.4rem] font-semibold leading-none tracking-[-0.03em] text-bone"
                >
                  <span className="font-display text-base font-normal italic text-signal">
                    0{index + 1}
                  </span>
                  {link.label}
                </motion.a>
              ))}
            </motion.nav>
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8, ease: EASE }}
            >
              <MagneticLink href={ctaHref} onClick={() => setOpen(false)}>
                {ctaLabel}
              </MagneticLink>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
