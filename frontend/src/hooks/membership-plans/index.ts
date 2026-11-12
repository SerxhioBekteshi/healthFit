import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membershipPlansService } from '@/services/membership-plans';
import type {
  MembershipPlanFormValues,
  PriceGridValues,
} from '@gym/shared/validation/membership-plans';

const plansQueryKey = ['membership-plans'] as const;

export const useMembershipPlans = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: plansQueryKey });

  const plansQuery = useQuery({
    queryKey: plansQueryKey,
    queryFn: membershipPlansService.list,
  });

  const createPlan = useMutation({
    meta: { success: 'Plan created.' },
    mutationFn: (input: MembershipPlanFormValues) =>
      membershipPlansService.create(input),
    onSuccess: invalidate,
  });

  const savePriceGrid = useMutation({
    meta: { success: 'Price list saved.' },
    mutationFn: (input: PriceGridValues) =>
      membershipPlansService.savePriceGrid(input),
    onSuccess: (data) => queryClient.setQueryData(plansQueryKey, data),
  });

  const updatePlan = useMutation({
    meta: { success: 'Plan updated.' },
    mutationFn: ({
      planId,
      input,
    }: {
      planId: string;
      input: MembershipPlanFormValues;
    }) => membershipPlansService.update(planId, input),
    onSuccess: invalidate,
  });

  const setPlanActive = useMutation({
    meta: { success: 'Plan visibility updated.' },
    mutationFn: ({ planId, isActive }: { planId: string; isActive: boolean }) =>
      membershipPlansService.setActive(planId, isActive),
    onSuccess: invalidate,
  });

  return {
    plans: plansQuery.data ?? [],
    isLoading: plansQuery.isLoading,
    error: plansQuery.error,
    createPlan,
    savePriceGrid,
    updatePlan,
    setPlanActive,
  };
};
