import { useQuery } from '@tanstack/react-query';
import { gymLocationsService } from '@/services/gym-locations';
import { queryKeys } from '../query-keys';

export const useGymLocations = () =>
  useQuery({
    queryKey: queryKeys.gymLocations,
    queryFn: gymLocationsService.list,
  });
