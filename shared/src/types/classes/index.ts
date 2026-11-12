export interface GymClass {
  id: string;
  gymId: string;
  name: string;
  description: string;
  // 1 (Monday) to 7 (Sunday).
  weekdays: number[];
  // Gym-local times, HH:MM.
  startTime: string;
  endTime: string;
  staffMemberId: string | null;
  staffMemberName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
