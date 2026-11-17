import { useQuery } from '@tanstack/react-query';
import { membershipPlansService } from '@/services/membership-plans';
import { queryKeys } from '../query-keys';

export const useMembershipPlans = () =>
  useQuery({
    queryKey: queryKeys.membershipPlans,
    queryFn: membershipPlansService.list,
  });
