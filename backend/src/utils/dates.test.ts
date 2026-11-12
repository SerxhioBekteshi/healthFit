import { describe, expect, it } from 'vitest';
import {
  addMonths,
  formatDateOnly,
  localParts,
  parseDateOnly,
  startOfLocalDay,
  startOfWeekDate,
} from '@/utils/dates';

describe('addMonths', () => {
  const add = (date: string, months: number): string =>
    formatDateOnly(addMonths(parseDateOnly(date), months));

  it('clamps to the end of shorter months', () => {
    expect(add('2026-01-31', 1)).toBe('2026-02-28');
    expect(add('2028-01-31', 1)).toBe('2028-02-29');
    expect(add('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('handles year boundaries and yearly cycles', () => {
    expect(add('2026-12-15', 1)).toBe('2027-01-15');
    expect(add('2026-02-28', 12)).toBe('2027-02-28');
    expect(add('2028-02-29', 12)).toBe('2029-02-28');
  });
});

describe('timezone helpers', () => {
  it('converts an instant to the gym local date and time', () => {
    // Tirane is UTC+1 in winter.
    const winter = localParts(
      new Date('2026-11-01T23:30:00Z'),
      'Europe/Tirane'
    );
    expect(winter.date).toBe('2026-11-02');
    expect(winter.time).toBe('00:30');

    // and UTC+2 in summer.
    const summer = localParts(
      new Date('2026-07-01T10:15:00Z'),
      'Europe/Tirane'
    );
    expect(summer.date).toBe('2026-07-01');
    expect(summer.time).toBe('12:15');
  });

  it('finds the UTC instant of local midnight, including across DST', () => {
    expect(startOfLocalDay('2026-11-02', 'Europe/Tirane').toISOString()).toBe(
      '2026-11-01T23:00:00.000Z'
    );
    expect(startOfLocalDay('2026-07-01', 'Europe/Tirane').toISOString()).toBe(
      '2026-06-30T22:00:00.000Z'
    );
    // Clocks go back on 2026-10-25 in Europe; that day is 25 hours long.
    const start = startOfLocalDay('2026-10-25', 'Europe/Tirane');
    const next = startOfLocalDay('2026-10-26', 'Europe/Tirane');
    expect((next.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it('uses the correct day for zones behind UTC', () => {
    const parts = localParts(
      new Date('2026-11-02T03:00:00Z'),
      'America/New_York'
    );
    expect(parts.date).toBe('2026-11-01');
    expect(
      startOfLocalDay('2026-11-01', 'America/New_York').toISOString()
    ).toBe('2026-11-01T04:00:00.000Z');
  });

  it('finds the Monday of a week', () => {
    expect(startOfWeekDate('2026-11-01')).toBe('2026-10-26'); // Sunday
    expect(startOfWeekDate('2026-10-26')).toBe('2026-10-26'); // Monday
    expect(startOfWeekDate('2026-10-29')).toBe('2026-10-26'); // Thursday
  });
});
