// Programs every new gym starts with; the owner edits, hides or deletes them. Exercise notes come
// from the guides next to this file (`describeExercise`), plus the short tip given here.
export interface DefaultExercise {
  name: string;
  // Key of the figure shown for the exercise (see the frontend exercise icons).
  icon: string;
  sets: number;
  reps: number;
  weight?: number;
  rest?: number;
  tip?: string;
}

export interface DefaultProgram {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  days: { focus: string; exercises: DefaultExercise[] }[];
}

export const DEFAULT_PROGRAMS: DefaultProgram[] = [
  {
    name: 'Full Body Starter',
    level: 'beginner',
    description: 'Three full-body sessions focused on the basics.',
    days: [
      {
        focus: 'Full Body A',
        exercises: [
          {
            name: 'Goblet Squat',
            tip: 'Hold the weight at your chest and keep your heels down.',
            icon: 'squat',
            sets: 3,
            reps: 10,
            weight: 12,
            rest: 90,
          },
          {
            name: 'Dumbbell Bench Press',
            tip: 'Lower slowly until the elbows reach chest level.',
            icon: 'bench-press',
            sets: 3,
            reps: 10,
            weight: 10,
            rest: 90,
          },
          {
            name: 'Seated Row',
            tip: 'Pull to the belly and squeeze your shoulder blades.',
            icon: 'row',
            sets: 3,
            reps: 12,
          },
          {
            name: 'Plank',
            icon: 'plank',
            sets: 3,
            reps: 30,
            rest: 45,
            tip: '30 second hold',
          },
        ],
      },
      {
        focus: 'Full Body B',
        exercises: [
          {
            name: 'Romanian Deadlift',
            tip: 'Hinge at the hips and keep the bar close to your legs.',
            icon: 'deadlift',
            sets: 3,
            reps: 10,
            weight: 30,
            rest: 90,
          },
          {
            name: 'Lat Pulldown',
            tip: 'Pull the bar to the upper chest, do not lean back.',
            icon: 'lat-pulldown',
            sets: 3,
            reps: 12,
          },
          {
            name: 'Shoulder Press',
            tip: 'Do not arch your lower back.',
            icon: 'overhead-press',
            sets: 3,
            reps: 10,
            weight: 8,
          },
        ],
      },
      {
        focus: 'Full Body C',
        exercises: [
          {
            name: 'Leg Press',
            tip: 'Do not lock your knees at the top.',
            icon: 'leg-press',
            sets: 3,
            reps: 12,
            rest: 90,
          },
          {
            name: 'Push-ups',
            tip: 'Keep your body in one straight line.',
            icon: 'push-up',
            sets: 3,
            reps: 10,
          },
          {
            name: 'Bike',
            icon: 'cardio',
            sets: 1,
            reps: 10,
            rest: 0,
            tip: '10 minutes easy',
          },
        ],
      },
    ],
  },
  {
    name: 'Push / Pull / Legs',
    level: 'intermediate',
    description: 'Classic split for regular lifters.',
    days: [
      {
        focus: 'Push',
        exercises: [
          {
            name: 'Barbell Bench Press',
            tip: 'Warm up with two light sets first.',
            icon: 'bench-press',
            sets: 4,
            reps: 8,
            weight: 60,
            rest: 120,
          },
          {
            name: 'Overhead Press',
            tip: 'Squeeze your glutes to protect your lower back.',
            icon: 'overhead-press',
            sets: 3,
            reps: 8,
            weight: 35,
            rest: 90,
          },
          {
            name: 'Triceps Pushdown',
            tip: 'Keep your elbows pinned to your sides.',
            icon: 'triceps',
            sets: 3,
            reps: 12,
          },
        ],
      },
      {
        focus: 'Pull',
        exercises: [
          {
            name: 'Deadlift',
            tip: 'Brace your core and push the floor away.',
            icon: 'deadlift',
            sets: 3,
            reps: 5,
            weight: 90,
            rest: 150,
          },
          {
            name: 'Pull-ups',
            tip: 'Use a band for help if you cannot reach 8 reps.',
            icon: 'pull-up',
            sets: 4,
            reps: 8,
          },
          {
            name: 'Barbell Curl',
            tip: 'No swinging: keep your upper arms still.',
            icon: 'curl',
            sets: 3,
            reps: 10,
            weight: 20,
          },
        ],
      },
      {
        focus: 'Legs',
        exercises: [
          {
            name: 'Back Squat',
            tip: 'Go down until your thighs are parallel to the floor.',
            icon: 'squat',
            sets: 4,
            reps: 8,
            weight: 80,
            rest: 120,
          },
          { name: 'Leg Curl', icon: 'machine', sets: 3, reps: 12 },
          { name: 'Calf Raise', icon: 'legs', sets: 4, reps: 15 },
        ],
      },
    ],
  },
  {
    name: 'Upper / Lower Power',
    level: 'advanced',
    description: 'Heavy four-day strength block.',
    days: [
      {
        focus: 'Upper A',
        exercises: [
          {
            name: 'Bench Press',
            icon: 'bench-press',
            sets: 5,
            reps: 5,
            weight: 85,
            rest: 150,
          },
          {
            name: 'Overhead Press',
            icon: 'overhead-press',
            sets: 4,
            reps: 6,
            weight: 45,
            rest: 120,
          },
          { name: 'Pull-ups', icon: 'pull-up', sets: 4, reps: 8, rest: 90 },
        ],
      },
      {
        focus: 'Lower A',
        exercises: [
          {
            name: 'Back Squat',
            icon: 'squat',
            sets: 5,
            reps: 5,
            weight: 110,
            rest: 180,
          },
          {
            name: 'Romanian Deadlift',
            icon: 'deadlift',
            sets: 4,
            reps: 8,
            weight: 80,
            rest: 120,
          },
          { name: 'Calf Raise', icon: 'legs', sets: 4, reps: 15, rest: 60 },
        ],
      },
      {
        focus: 'Upper B',
        exercises: [
          {
            name: 'Weighted Pull-up',
            icon: 'pull-up',
            sets: 4,
            reps: 6,
            weight: 10,
            rest: 120,
          },
          {
            name: 'Barbell Bench Press',
            icon: 'bench-press',
            sets: 4,
            reps: 8,
            weight: 70,
            rest: 120,
          },
          {
            name: 'Barbell Curl',
            icon: 'curl',
            sets: 3,
            reps: 10,
            weight: 25,
          },
          {
            name: 'Triceps Pushdown',
            icon: 'triceps',
            sets: 3,
            reps: 12,
          },
        ],
      },
      {
        focus: 'Lower B',
        exercises: [
          {
            name: 'Deadlift',
            icon: 'deadlift',
            sets: 4,
            reps: 4,
            weight: 140,
            rest: 180,
          },
          {
            name: 'Leg Press',
            icon: 'leg-press',
            sets: 4,
            reps: 10,
            weight: 120,
            rest: 120,
          },
          { name: 'Leg Curl', icon: 'machine', sets: 3, reps: 12, rest: 90 },
        ],
      },
    ],
  },
];
