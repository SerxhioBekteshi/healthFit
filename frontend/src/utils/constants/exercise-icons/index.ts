import { t } from '@/i18n';

export interface ExerciseFigure {
  // Head centre; everything else is stroked as paths in a 64x64 box.
  head: [number, number];
  body: string;
  // Bars, cables, floor and benches, drawn lighter than the body.
  gear?: string;
}

export interface ExerciseIcon {
  key: string;
  label: string;
  figure: ExerciseFigure;
}

const FLOOR = 'M4 50 L60 50';

// Stick figures that show the movement; the gym can upload its own photo instead.
// Labels are getters so they translate when read, not when the module loads.
export const EXERCISE_ICONS: ExerciseIcon[] = [
  {
    key: 'squat',
    get label() {
      return t('Squat');
    },
    figure: {
      head: [30, 13],
      body: 'M30 19 L27 37 L40 42 L35 56 L43 56 M30 21 L37 27 L43 20',
      gear: 'M14 20 L46 20 M14 14 L14 26 M46 14 L46 26',
    },
  },
  {
    key: 'bench-press',
    get label() {
      return t('Bench press');
    },
    figure: {
      head: [11, 38],
      body: 'M16 40 L36 40 L46 32 L50 44 M22 40 L22 20',
      gear: 'M8 46 L50 46 M14 46 L14 56 M44 46 L44 56 M12 20 L32 20 M12 15 L12 25 M32 15 L32 25',
    },
  },
  {
    key: 'deadlift',
    get label() {
      return t('Deadlift');
    },
    figure: {
      head: [41, 15],
      body: 'M37 21 L22 30 L28 44 L26 57 L34 57 M37 21 L35 46',
      gear: 'M20 47 L50 47 M20 41 L20 53 M50 41 L50 53',
    },
  },
  {
    key: 'overhead-press',
    get label() {
      return t('Shoulder press');
    },
    figure: {
      head: [32, 17],
      body: 'M32 23 L32 41 L27 58 M32 41 L37 58 M32 25 L24 14 L24 8 M32 25 L40 14 L40 8',
      gear: 'M12 8 L52 8 M12 3 L12 13 M52 3 L52 13',
    },
  },
  {
    key: 'pull-up',
    get label() {
      return t('Pull-up');
    },
    figure: {
      head: [32, 19],
      body: 'M32 25 L32 43 L27 57 M32 43 L37 57 M22 6 L27 14 L32 25 M42 6 L37 14 L32 25',
      gear: 'M10 6 L54 6',
    },
  },
  {
    key: 'row',
    get label() {
      return t('Seated row');
    },
    figure: {
      head: [22, 13],
      body: 'M22 19 L22 40 L42 40 L44 56 M22 24 L34 30 L40 28',
      gear: 'M40 28 L60 28 M40 23 L40 33',
    },
  },
  {
    key: 'lat-pulldown',
    get label() {
      return t('Lat pulldown');
    },
    figure: {
      head: [28, 22],
      body: 'M28 28 L28 46 L44 46 L46 58 M28 30 L20 18 L18 8 M28 30 L36 18 L38 8',
      gear: 'M12 8 L44 8 M28 8 L28 0',
    },
  },
  {
    key: 'curl',
    get label() {
      return t('Biceps curl');
    },
    figure: {
      head: [28, 13],
      body: 'M28 19 L28 40 L24 58 M28 40 L33 58 M28 23 L31 34 L40 25',
      gear: 'M37 21 L43 29',
    },
  },
  {
    key: 'triceps',
    get label() {
      return t('Triceps pushdown');
    },
    figure: {
      head: [28, 13],
      body: 'M28 19 L28 40 L24 58 M28 40 L33 58 M28 23 L31 34 L33 46',
      gear: 'M34 2 L34 46 M30 46 L38 46',
    },
  },
  {
    key: 'lunge',
    get label() {
      return t('Lunge');
    },
    figure: {
      head: [32, 13],
      body: 'M32 19 L32 34 L44 38 L44 56 L50 56 M32 34 L22 46 L14 55 M32 22 L28 32',
      gear: FLOOR,
    },
  },
  {
    key: 'leg-press',
    get label() {
      return t('Leg press');
    },
    figure: {
      head: [12, 32],
      body: 'M16 34 L24 46 L38 38 L48 30',
      gear: 'M8 30 L26 52 M52 20 L52 40',
    },
  },
  {
    key: 'push-up',
    get label() {
      return t('Push-up');
    },
    figure: {
      head: [10, 26],
      body: 'M15 30 L54 46 M17 31 L17 46',
      gear: FLOOR,
    },
  },
  {
    key: 'plank',
    get label() {
      return t('Plank');
    },
    figure: {
      head: [10, 34],
      body: 'M15 37 L54 46 M17 38 L17 48 L26 48',
      gear: FLOOR,
    },
  },
  {
    key: 'crunch',
    get label() {
      return t('Crunch');
    },
    figure: {
      head: [22, 30],
      body: 'M26 34 L36 46 L46 34 L54 46 M26 34 L20 27',
      gear: FLOOR,
    },
  },
  {
    key: 'run',
    get label() {
      return t('Running');
    },
    figure: {
      head: [34, 12],
      body: 'M32 18 L28 36 L38 45 L36 57 M28 36 L20 46 L11 50 M32 22 L40 29 L46 22 M32 22 L24 29 L20 36',
    },
  },
];

// Keys saved before the movement figures existed.
const LEGACY_KEYS: Record<string, string> = {
  barbell: 'bench-press',
  dumbbell: 'curl',
  bench: 'bench-press',
  chest: 'push-up',
  back: 'pull-up',
  legs: 'squat',
  shoulders: 'overhead-press',
  biceps: 'curl',
  core: 'crunch',
  cardio: 'run',
  machine: 'leg-press',
  cable: 'lat-pulldown',
  kettlebell: 'deadlift',
  stretch: 'plank',
};

export const getExerciseIcon = (key: string): ExerciseIcon => {
  const resolved = LEGACY_KEYS[key] ?? key;
  return (
    EXERCISE_ICONS.find((icon) => icon.key === resolved) ?? EXERCISE_ICONS[7]
  );
};
