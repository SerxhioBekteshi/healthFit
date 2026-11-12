import React from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/components/landing/brand';
import { TiltCard } from '@/components/landing/TiltCard';
import { Badge } from '@/components/ui/Badge';

const EXERCISES = [
  { name: 'Barbell Bench Press', detail: '4×8 @ 60kg', done: 100 },
  { name: 'Overhead Press', detail: '3×8 @ 35kg', done: 100 },
  { name: 'Incline Dumbbell Press', detail: '3×10 @ 22kg', done: 64 },
  { name: 'Triceps Pushdown', detail: '3×12', done: 0 },
];

// Mirrors a member's workout program card: title, level, then a training day.
export const MockWorkout: React.FC = () => (
  <TiltCard className="w-full max-w-md">
    <div className="flex flex-wrap items-center gap-3">
      <h3 className="text-lg font-semibold text-bone">Push day</h3>
      <Badge tone="info">Intermediate</Badge>
    </div>
    <p className="mt-2 text-xs text-bone/45">3 sessions / week</p>

    <div className="mt-5 rounded-xl border border-white/[0.08] bg-ink/60 p-4">
      <p className="text-xs font-semibold text-signal">Day 1</p>
      <p className="mt-1 text-sm font-semibold text-bone">Chest and triceps</p>

      <ul className="mt-4 space-y-4">
        {EXERCISES.map((exercise, index) => (
          <li key={exercise.name}>
            <div className="flex items-baseline justify-between gap-4 text-xs">
              <span className="font-medium text-bone">{exercise.name}</span>
              <span className="shrink-0 text-bone/60">{exercise.detail}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-signal"
                initial={{ width: 0 }}
                whileInView={{ width: `${exercise.done}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.2,
                  ease: EASE,
                  delay: 0.25 + index * 0.12,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>

    <div className="mt-4 flex items-center justify-between text-xs text-bone/50">
      <span>Rest between sets · 90s</span>
      <span className="text-bone">2 of 4 complete</span>
    </div>
  </TiltCard>
);
