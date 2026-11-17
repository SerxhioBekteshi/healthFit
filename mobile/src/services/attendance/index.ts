import { apiClient } from '@/api/client';
import type {
  AttendanceDays,
  AttendanceHistoryPage,
  AttendanceRecord,
} from '@gym/shared/types';

export const attendanceService = {
  history: (cursor?: string) =>
    apiClient.get<AttendanceHistoryPage>('/attendance/history', { cursor }),
  // The days of one month (YYYY-MM) on which the member checked in.
  days: (month: string) =>
    apiClient.get<AttendanceDays>('/attendance/days', { month }),
  // A member checks themselves out; the server finds their open visit.
  checkOut: () => apiClient.post<AttendanceRecord>('/attendance/check-out', {}),
};
