const DAY_MS = 24 * 60 * 60 * 1000;

// Dates are calendar dates (YYYY-MM-DD) handled in UTC.
export const parseDateOnly = (value: string): Date =>
  new Date(`${value}T00:00:00.000Z`);

export const formatDateOnly = (date: Date): string =>
  date.toISOString().slice(0, 10);

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_MS);

export const todayUtc = (): Date => parseDateOnly(formatDateOnly(new Date()));

// Month arithmetic that clamps the day: 31 Jan + 1 month is the last day of February.
export const addMonths = (date: Date, months: number): Date => {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
};

export interface LocalParts {
  date: string;
  time: string;
  // Milliseconds the local clock is ahead of UTC at this instant.
  offsetMs: number;
}

export const localParts = (instant: Date, timeZone: string): LocalParts => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) {
    parts[part.type] = part.value;
  }
  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const wholeSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    offsetMs: localAsUtc - wholeSeconds,
  };
};

// The UTC instant at which the given local calendar date starts in `timeZone`.
export const startOfLocalDay = (date: string, timeZone: string): Date => {
  const midnightAsUtc = parseDateOnly(date);
  let start = new Date(
    midnightAsUtc.getTime() - localParts(midnightAsUtc, timeZone).offsetMs
  );
  // Second pass corrects the offset when a DST change falls between the two instants.
  start = new Date(
    midnightAsUtc.getTime() - localParts(start, timeZone).offsetMs
  );
  return start;
};

// Monday of the week containing the given calendar date.
export const startOfWeekDate = (date: string): string => {
  const day = parseDateOnly(date).getUTCDay();
  return formatDateOnly(addDays(parseDateOnly(date), -((day + 6) % 7)));
};
