import { useMutation, useQuery } from '@tanstack/react-query';
import { useSession } from '@/providers/SessionProvider';
import { communityService } from '@/services/community';
import { queryKeys } from '../query-keys';

export const useCommunityGyms = (country?: string) =>
  useQuery({
    queryKey: queryKeys.communityGyms(country ?? 'own'),
    queryFn: () => communityService.gyms(country),
  });

// Once a gym is picked, `/me` has a gym and the screens guarded by it let the member into the app.
export const useJoinGym = () => {
  const { refreshUser } = useSession();
  return useMutation({
    meta: { success: 'You joined the gym.' },
    mutationFn: async (gymId: string) => {
      const joined = await communityService.join(gymId);
      await refreshUser();
      return joined;
    },
  });
};
