import { apiClient } from '@/services/api';

export const uploadsService = {
  // Stores an image of the gym and returns its path to save on a product or exercise.
  image: (file: File) => apiClient.upload<{ url: string }>('/uploads', file),
};
