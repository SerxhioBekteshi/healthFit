import { useQuery } from '@tanstack/react-query';
import { hasChosenLanguage, setCurrency, setLanguage } from '@/i18n';
import { meService } from '@/services/me';
import { countryConfig } from '@/utils/constants/countries';
import type { User } from '@gym/shared/types';

interface UseSessionResult {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// The gym's country sets the currency and the starting language; an explicit choice wins.
const applyGymLocale = (user: User): void => {
  if (!user.gymCountry) return;
  const config = countryConfig[user.gymCountry];
  setCurrency(config.currency);
  if (!hasChosenLanguage()) setLanguage(config.language);
};

export const useSession = (): UseSessionResult => {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await meService.get();
      applyGymLocale(user);
      return user;
    },
    retry: false,
    // A signed-out visitor is not an error.
    meta: { silent: true },
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: Boolean(data),
  };
};
