import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffMembersService } from '@/services/staff-members';
import type { StaffMemberFormValues } from '@gym/shared/validation/staff-members';

const staffQueryKey = ['staff-members'] as const;

export const useStaffMembers = () => {
  const queryClient = useQueryClient();
  // A renamed or deactivated instructor also changes the class list.
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: staffQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['classes'] }),
    ]);
  };

  const staffQuery = useQuery({
    queryKey: staffQueryKey,
    queryFn: staffMembersService.list,
  });

  const createStaffMember = useMutation({
    meta: { success: 'Staff member created.' },
    mutationFn: (input: StaffMemberFormValues) =>
      staffMembersService.create(input),
    onSuccess: invalidate,
  });

  const updateStaffMember = useMutation({
    meta: { success: 'Staff member updated.' },
    mutationFn: ({
      staffMemberId,
      input,
    }: {
      staffMemberId: string;
      input: StaffMemberFormValues;
    }) => staffMembersService.update(staffMemberId, input),
    onSuccess: invalidate,
  });

  const setStaffMemberActive = useMutation({
    meta: { success: 'Staff member status updated.' },
    mutationFn: ({
      staffMemberId,
      isActive,
    }: {
      staffMemberId: string;
      isActive: boolean;
    }) => staffMembersService.setActive(staffMemberId, isActive),
    onSuccess: invalidate,
  });

  return {
    staffMembers: staffQuery.data ?? [],
    isLoading: staffQuery.isLoading,
    error: staffQuery.error,
    createStaffMember,
    updateStaffMember,
    setStaffMemberActive,
  };
};
