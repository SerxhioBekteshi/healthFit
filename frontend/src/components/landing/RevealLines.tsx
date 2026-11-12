import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { EASE } from '@/components/landing/brand';
import { usePrefersReducedMotion } from '@/hooks/media-query';

interface RevealLinesProps {
  lines: React.ReactNode[];
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  delay?: number;
  // Play on mount instead of when scrolled into view.
  immediate?: boolean;
}

// Each line rises out of its own mask, the way film titles are cut.
export const RevealLines: React.FC<RevealLinesProps> = ({
  lines,
  as: Tag = 'h2',
  className,
  delay = 0,
  immediate = false,
}) => {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <Tag className={className}>
        {lines.map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  const variants: Variants = {
    hidden: { y: '118%' },
    visible: (index: number) => ({
      y: '0%',
      transition: { duration: 1.15, ease: EASE, delay: delay + index * 0.11 },
    }),
  };
  const trigger = immediate
    ? { animate: 'visible' }
    : {
        whileInView: 'visible',
        viewport: { once: true, margin: '0px 0px -12% 0px' },
      };

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <span
          key={index}
          className="-mb-[0.09em] block overflow-hidden pb-[0.09em]"
        >
          <motion.span
            className="block will-change-transform"
            custom={index}
            variants={variants}
            initial="hidden"
            {...trigger}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
};
