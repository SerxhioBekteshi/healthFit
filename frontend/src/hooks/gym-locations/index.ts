import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymLocationsService } from '@/services/gym-locations';
import type { GymLocationFormValues } from '@gym/shared/validation/gym-locations';

const locationsQueryKey = ['gym-locations'] as const;

export const useGymLocations = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: locationsQueryKey });

  const locationsQuery = useQuery({
    queryKey: locationsQueryKey,
    queryFn: gymLocationsService.list,
  });

  const createLocation = useMutation({
    meta: { success: 'Gym added.' },
    mutationFn: (input: GymLocationFormValues) =>
      gymLocationsService.create(input),
    onSuccess: invalidate,
  });

  const updateLocation = useMutation({
    meta: { success: 'Gym updated.' },
    mutationFn: ({
      locationId,
      input,
    }: {
      locationId: string;
      input: GymLocationFormValues;
    }) => gymLocationsService.update(locationId, input),
    onSuccess: invalidate,
  });

  const setLocationActive = useMutation({
    meta: { success: 'Gym status updated.' },
    mutationFn: ({
      locationId,
      isActive,
    }: {
      locationId: string;
      isActive: boolean;
    }) => gymLocationsService.setActive(locationId, isActive),
    onSuccess: invalidate,
  });

  const locations = locationsQuery.data ?? [];

  return {
    locations,
    // Where members can train today; the check-in screen offers only these.
    activeLocations: locations.filter((location) => location.isActive),
    isLoading: locationsQuery.isLoading,
    error: locationsQuery.error,
    createLocation,
    updateLocation,
    setLocationActive,
  };
};
