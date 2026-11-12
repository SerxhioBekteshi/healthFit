import React from 'react';
import { TiltCard } from '@/components/landing/TiltCard';

const SIZE = 21;
const FINDERS: [number, number][] = [
  [0, 0],
  [0, SIZE - 7],
  [SIZE - 7, 0],
];

const finderCell = (row: number, col: number): boolean | null => {
  for (const [originRow, originCol] of FINDERS) {
    const localRow = row - originRow;
    const localCol = col - originCol;
    if (localRow >= 0 && localRow < 7 && localCol >= 0 && localCol < 7) {
      const border =
        localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
      const core =
        localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
      return border || core;
    }
  }
  return null;
};

// Deterministic pattern so server and client render the same code.
const CELLS = Array.from({ length: SIZE * SIZE }, (_, index) => {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const finder = finderCell(row, col);
  return {
    row,
    col,
    filled: finder ?? (row * 31 + col * 17 + row * col * 7) % 5 < 2,
  };
}).filter((cell) => cell.filled);

export const MockQr: React.FC = () => (
  <TiltCard className="w-full max-w-sm text-center">
    <p className="text-sm text-bone/55">Check-in pass</p>

    <div className="relative mx-auto mt-4 w-fit">
      <span
        aria-hidden
        className="absolute inset-0 animate-ping-slow rounded-xl border border-signal/40 motion-reduce:animate-none"
      />
      <span
        aria-hidden
        className="absolute inset-0 animate-ping-slow rounded-xl border border-signal/25 [animation-delay:1.1s] motion-reduce:animate-none"
      />
      <div className="relative rounded-xl bg-white p-3">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-40 w-40 sm:h-44 sm:w-44"
          shapeRendering="crispEdges"
          role="img"
          aria-label="Example check-in QR code"
        >
          {CELLS.map((cell) => (
            <rect
              key={`${cell.row}-${cell.col}`}
              x={cell.col}
              y={cell.row}
              width="1.02"
              height="1.02"
              className="fill-ink"
            />
          ))}
        </svg>
      </div>
    </div>

    <p className="mt-4 text-xs text-bone/50">Show this code at reception.</p>

    <div className="mt-5 flex items-center gap-3 rounded-lg border border-signal/25 bg-signal/10 px-4 py-3 text-left">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-signal text-ink">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m5 12 5 5 9-10" />
        </svg>
      </span>
      <div className="text-sm">
        <p className="font-semibold text-bone">Checked in</p>
        <p className="text-xs text-bone/60">Welcome back, Alex</p>
      </div>
    </div>
  </TiltCard>
);
