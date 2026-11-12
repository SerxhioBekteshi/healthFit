import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classesService } from '@/services/classes';
import type { ClassFormValues } from '@gym/shared/validation/classes';

const classesQueryKey = ['classes'] as const;

export const useClasses = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: classesQueryKey });

  const classesQuery = useQuery({
    queryKey: classesQueryKey,
    queryFn: classesService.list,
  });

  const createClass = useMutation({
    meta: { success: 'Class created.' },
    mutationFn: (input: ClassFormValues) => classesService.create(input),
    onSuccess: invalidate,
  });

  const updateClass = useMutation({
    meta: { success: 'Class updated.' },
    mutationFn: ({
      classId,
      input,
    }: {
      classId: string;
      input: ClassFormValues;
    }) => classesService.update(classId, input),
    onSuccess: invalidate,
  });

  const setClassActive = useMutation({
    meta: { success: 'Class visibility updated.' },
    mutationFn: ({
      classId,
      isActive,
    }: {
      classId: string;
      isActive: boolean;
    }) => classesService.setActive(classId, isActive),
    onSuccess: invalidate,
  });

  const deleteClass = useMutation({
    meta: { success: 'Class deleted.' },
    mutationFn: (classId: string) => classesService.remove(classId),
    onSuccess: invalidate,
  });

  return {
    classes: classesQuery.data ?? [],
    isLoading: classesQuery.isLoading,
    error: classesQuery.error,
    createClass,
    updateClass,
    setClassActive,
    deleteClass,
  };
};
