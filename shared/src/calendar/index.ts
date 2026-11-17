// Calendar helpers shared by the web and mobile apps. Months are `YYYY-MM` and days `YYYY-MM-DD`,
// calendar dates without a time zone, so the arithmetic is done in UTC.

const pad = (value: number): string => String(value).padStart(2, '0');

const parts = (month: string): { year: number; index: number } => {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  return { year, index: monthNumber - 1 };
};

export const monthOf = (date: string): string => date.slice(0, 7);

// "2026-11" + 1 -> "2026-12"; "2026-12" + 1 -> "2027-01".
export const shiftMonth = (month: string, delta: number): string => {
  const { year, index } = parts(month);
  const shifted = new Date(Date.UTC(year, index + delta, 1));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`;
};

// The weeks of a month, Monday first. A week has 7 entries: the day (YYYY-MM-DD),
// or null where it belongs to the neighbouring month.
export const monthWeeks = (month: string): (string | null)[][] => {
  const { year, index } = parts(month);
  const daysInMonth = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  // getUTCDay: 0 is Sunday; the grid starts on Monday.
  const offset = (new Date(Date.UTC(year, index, 1)).getUTCDay() + 6) % 7;

  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, day) => `${month}-${pad(day + 1)}`
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7)
  );
};
