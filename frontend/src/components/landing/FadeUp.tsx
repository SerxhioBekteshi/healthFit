import React from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/components/landing/brand';
import { usePrefersReducedMotion } from '@/hooks/media-query';

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}

export const FadeUp: React.FC<FadeUpProps> = ({
  children,
  className,
  delay = 0,
  immediate = false,
}) => {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const trigger = immediate
    ? { animate: { opacity: 1, y: 0 } }
    : {
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '0px 0px -10% 0px' },
      };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      transition={{ duration: 1, ease: EASE, delay }}
      {...trigger}
    >
      {children}
    </motion.div>
  );
};
