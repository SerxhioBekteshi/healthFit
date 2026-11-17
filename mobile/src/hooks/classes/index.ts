import { useQuery } from '@tanstack/react-query';
import { classesService } from '@/services/classes';
import { queryKeys } from '../query-keys';

export const useClasses = () =>
  useQuery({ queryKey: queryKeys.classes, queryFn: classesService.list });
