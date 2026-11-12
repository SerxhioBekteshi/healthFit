import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { FadeUp } from '@/components/landing/FadeUp';
import { usePrefersReducedMotion } from '@/hooks/media-query';

type Tone = 'plain' | 'accent' | 'serif';

const MANIFESTO =
  'Most gyms run on spreadsheets, paper cards and goodwill. We believe the place where people change their lives deserves software as considered as the equipment on the floor — quiet, precise, and impossible to get wrong.';

// Phrases set apart inside the sentence; they must appear in it as written to be styled.
const EMPHASIS: { text: string; tone: Tone }[] = [
  { text: 'considered', tone: 'serif' },
  { text: 'floor', tone: 'accent' },
  { text: 'quiet, precise,', tone: 'serif' },
  { text: 'wrong.', tone: 'accent' },
];

const buildWords = (): { text: string; tone: Tone }[] => {
  const sentence = MANIFESTO;
  const ranges: { start: number; end: number; tone: Tone }[] = [];
  let cursor = 0;
  for (const item of EMPHASIS) {
    const phrase = item.text;
    const start = sentence.indexOf(phrase, cursor);
    if (start < 0) continue;
    cursor = start + phrase.length;
    ranges.push({ start, end: cursor, tone: item.tone });
  }
  return Array.from(sentence.matchAll(/\S+/g), (match) => {
    const at = match.index ?? 0;
    const range = ranges.find((item) => at >= item.start && at < item.end);
    return { text: match[0], tone: range?.tone ?? 'plain' };
  });
};

const toneClass: Record<Tone, string> = {
  plain: '',
  accent: 'text-signal',
  serif: 'font-display font-normal italic',
};

interface WordProps {
  text: string;
  tone: Tone;
  index: number;
  count: number;
  progress: MotionValue<number>;
  reduced: boolean;
}

const Word: React.FC<WordProps> = ({
  text,
  tone,
  index,
  count,
  progress,
  reduced,
}) => {
  const start = (index / count) * 0.92;
  const opacity = useTransform(progress, [start, start + 0.08], [0.14, 1]);
  const y = useTransform(progress, [start, start + 0.08], [10, 0]);

  return (
    <motion.span
      className={`mr-[0.28em] inline-block ${toneClass[tone]}`}
      style={reduced ? undefined : { opacity, y }}
    >
      {text}
    </motion.span>
  );
};

export const Manifesto: React.FC = () => {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();
  const words = buildWords();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  });
  const pulseProgress = useTransform(scrollYProgress, [0.6, 1], [0, 1]);

  return (
    <section className="relative bg-ink px-5 py-[22vh] sm:px-8 md:px-14 md:py-[30vh]">
      <div className="mx-auto max-w-[1200px]">
        <FadeUp className="mb-10 flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.22em] text-bone/50 md:mb-14">
          <span className="h-px w-10 bg-signal" />
          Manifesto
        </FadeUp>

        <p
          ref={ref}
          className="text-[clamp(1.85rem,4.6vw,4.2rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-bone"
        >
          {words.map((word, index) => (
            <Word
              key={index}
              text={word.text}
              tone={word.tone}
              index={index}
              count={words.length}
              progress={scrollYProgress}
              reduced={reduced}
            />
          ))}
        </p>

        <svg
          viewBox="0 0 640 80"
          className="mt-16 h-auto w-full max-w-xl md:mt-24"
          fill="none"
          aria-hidden
        >
          <path
            d="M0 40 H150 L172 8 L200 72 L226 40 H400 L418 24 L434 56 L450 40 H640"
            className="stroke-white/10"
            strokeWidth="1.5"
          />
          <motion.path
            d="M0 40 H150 L172 8 L200 72 L226 40 H400 L418 24 L434 56 L450 40 H640"
            className="stroke-signal"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: reduced ? 1 : pulseProgress }}
          />
        </svg>
      </div>
    </section>
  );
};
