import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymAdminsService } from '@/services/gym-admins';
import type {
  CreateGymAdminValues,
  UpdateGymAdminValues,
} from '@gym/shared/validation/gym-admins';

const gymAdminsQueryKey = ['gym-admins'] as const;

export const useGymAdmins = () => {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: gymAdminsQueryKey }),
      // Gym rows list their admin emails.
      queryClient.invalidateQueries({ queryKey: ['gyms'] }),
    ]);
  };

  const gymAdminsQuery = useQuery({
    queryKey: gymAdminsQueryKey,
    queryFn: gymAdminsService.list,
  });

  const createGymAdmin = useMutation({
    meta: { success: 'Gym admin created.' },
    mutationFn: (input: CreateGymAdminValues) => gymAdminsService.create(input),
    onSuccess: invalidate,
  });

  const updateGymAdmin = useMutation({
    meta: { success: 'Gym admin updated.' },
    mutationFn: ({
      gymAdminId,
      input,
    }: {
      gymAdminId: string;
      input: UpdateGymAdminValues;
    }) => gymAdminsService.update(gymAdminId, input),
    onSuccess: invalidate,
  });

  const deleteGymAdmin = useMutation({
    meta: { success: 'Gym admin deleted.' },
    mutationFn: (gymAdminId: string) => gymAdminsService.remove(gymAdminId),
    onSuccess: invalidate,
  });

  return {
    gymAdmins: gymAdminsQuery.data ?? [],
    isLoading: gymAdminsQuery.isLoading,
    error: gymAdminsQuery.error,
    createGymAdmin,
    updateGymAdmin,
    deleteGymAdmin,
  };
};
