import { useMutation } from '@tanstack/react-query';
import { uploadsService } from '@/services/uploads';

export const useImageUpload = () =>
  useMutation({
    meta: { success: 'Image uploaded.' },
    mutationFn: (file: File) => uploadsService.image(file),
  });
