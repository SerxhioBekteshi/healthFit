// Classes every gym starts with; weekdays run 1 (Monday) to 7 (Sunday) and there is no instructor yet.
export interface DefaultClass {
  name: string;
  description: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
}

export const DEFAULT_CLASSES: DefaultClass[] = [
  {
    name: 'Abs',
    description: 'Core strength: planks, crunches and controlled leg raises.',
    weekdays: [1, 3, 5],
    startTime: '18:00',
    endTime: '18:45',
  },
  {
    name: 'Aerobics',
    description: 'High-energy cardio to music. All levels.',
    weekdays: [2, 4],
    startTime: '19:00',
    endTime: '20:00',
  },
  {
    name: 'Zumba',
    description: 'Dance workout, no experience needed.',
    weekdays: [6],
    startTime: '10:00',
    endTime: '11:00',
  },
  {
    name: 'Yoga',
    description: 'Breathing, balance and flexibility for body and mind.',
    weekdays: [1, 3],
    startTime: '19:00',
    endTime: '20:00',
  },
  {
    name: 'Pilates',
    description: 'Low-impact exercises for posture, core and control.',
    weekdays: [2, 4],
    startTime: '18:00',
    endTime: '19:00',
  },
  {
    name: 'Spinning',
    description: 'Indoor cycling intervals led by the beat.',
    weekdays: [1, 3, 5],
    startTime: '07:00',
    endTime: '07:45',
  },
  {
    name: 'Cross Training',
    description: 'Circuit of lifting, jumping and conditioning.',
    weekdays: [2, 4],
    startTime: '07:00',
    endTime: '08:00',
  },
  {
    name: 'Stretching & Mobility',
    description: 'Slow session to recover and loosen up for the week.',
    weekdays: [7],
    startTime: '11:00',
    endTime: '12:00',
  },
];
