import React from 'react';

interface HeroChipProps {
  className: string;
  delay: string;
  children: React.ReactNode;
  dot?: boolean;
}

export const HeroChip: React.FC<HeroChipProps> = ({
  className,
  delay,
  children,
  dot = false,
}) => (
  <div
    className={`absolute animate-float rounded-full border border-white/10 bg-ink/60 px-4 py-2.5 text-[0.8rem] font-medium tracking-[0.02em] text-bone shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl motion-reduce:animate-none ${className}`}
    style={{ animationDelay: delay }}
  >
    <span className="flex items-center gap-2.5">
      {dot ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping-slow rounded-full bg-signal motion-reduce:animate-none" />
          <span className="relative h-2 w-2 rounded-full bg-signal" />
        </span>
      ) : null}
      {children}
    </span>
  </div>
);
