import { apiClient } from '@/services/api';
import type {
  AttendanceHistoryPage,
  AttendanceRecord,
  AttendanceStats,
} from '@gym/shared/types';

export const attendanceService = {
  list: (limit?: number) =>
    apiClient.get<AttendanceRecord[]>(
      limit ? `/attendance?limit=${limit}` : '/attendance'
    ),
  history: (cursor?: string) =>
    apiClient.get<AttendanceHistoryPage>(
      cursor
        ? `/attendance/history?cursor=${encodeURIComponent(cursor)}`
        : '/attendance/history'
    ),
  stats: () => apiClient.get<AttendanceStats>('/attendance/stats'),
  checkIn: (clientId: string, locationId?: string) =>
    apiClient.post<AttendanceRecord>('/attendance/check-in', {
      clientId,
      locationId,
    }),
};
