import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowIcon } from '@/components/landing/ArrowIcon';

interface MagneticLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'solid' | 'ghost';
  onClick?: () => void;
}

const base =
  'group relative inline-flex items-center gap-3 overflow-hidden rounded-full py-3 pl-6 pr-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-500';

const variants = {
  solid: 'bg-signal text-ink',
  ghost:
    'border border-white/20 bg-white/[0.04] text-bone backdrop-blur-md hover:border-white/50 hover:bg-white/10',
};

// The button leans toward the pointer; the arrow turns and a sheen sweeps across on hover.
export const MagneticLink: React.FC<MagneticLinkProps> = ({
  href,
  children,
  variant = 'solid',
  onClick,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * 0.28);
    y.set((event.clientY - (rect.top + rect.height / 2)) * 0.4);
  };

  const onPointerLeave = (): void => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className="inline-block"
      style={{ x: springX, y: springY }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <Link
        to={href}
        onClick={onClick}
        className={`${base} ${variants[variant]}`}
      >
        {variant === 'solid' ? (
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
          />
        ) : null}
        <span className="relative">{children}</span>
        <span
          className={`relative grid h-9 w-9 place-items-center rounded-full transition-transform duration-500 group-hover:rotate-45 ${
            variant === 'solid' ? 'bg-ink text-signal' : 'bg-bone text-ink'
          }`}
        >
          <ArrowIcon />
        </span>
      </Link>
    </motion.div>
  );
};
