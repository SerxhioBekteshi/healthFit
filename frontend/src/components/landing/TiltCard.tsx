import React from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useMediaQuery } from '@/hooks/media-query';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

// Subtle 3D tilt with a moving highlight; only on devices that actually hover.
export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
}) => {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const spring = { stiffness: 160, damping: 18, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [0, 1], [7, -7]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-9, 9]), spring);
  const glowX = useTransform(x, (value) => `${value * 100}%`);
  const glowY = useTransform(y, (value) => `${value * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glowX} ${glowY}, rgba(255, 255, 255, 0.06), transparent 55%)`;

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!fine) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  };

  const onPointerLeave = (): void => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={
        fine ? { rotateX, rotateY, transformPerspective: 1100 } : undefined
      }
      className={`relative rounded-xl border border-white/10 bg-panel p-5 shadow-[0_28px_70px_-36px_rgba(0,0,0,0.5)] sm:p-6 ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ backgroundImage: glare, opacity: fine ? 1 : 0 }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
};
