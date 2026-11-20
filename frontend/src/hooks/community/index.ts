import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityService } from '@/services/community';

// `country` is a code or `all`; leave it out to start with the member's own country.
export const useCommunityGyms = (country?: string) =>
  useQuery({
    queryKey: ['community-gyms', country ?? 'own'],
    queryFn: () => communityService.gyms(country),
  });

// Once a gym is picked the session user has a gym, which moves the member out of the community.
export const useJoinGym = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { success: 'You joined the gym.' },
    mutationFn: (gymId: string) => communityService.join(gymId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
};
