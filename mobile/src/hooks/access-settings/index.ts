import { useQuery } from '@tanstack/react-query';
import { accessSettingsService } from '@/services/access-settings';
import type { AccessSettings } from '@gym/shared/types';
import { queryKeys } from '../query-keys';

// Until the answer arrives nothing is offered, which is the default of a gym.
const allOff: AccessSettings = { cardsEnabled: false, lockersUseCard: false };

export const useAccessSettings = (): AccessSettings =>
  useQuery({
    queryKey: queryKeys.accessSettings,
    queryFn: accessSettingsService.get,
  }).data ?? allOff;
