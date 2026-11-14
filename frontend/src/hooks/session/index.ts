import { useQuery } from '@tanstack/react-query';
import { hasChosenLanguage, setCurrency, setLanguage } from '@/i18n';
import { meService } from '@/services/me';
import { countryConfig } from '@/utils/constants/countries';
import type { CountryCode, User } from '@gym/shared/types';

interface UseSessionResult {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// The gym's country sets the starting language; an explicit choice wins. The currency is not touched.
export const applyGymCountryLanguage = (country: CountryCode): void => {
  if (!hasChosenLanguage()) setLanguage(countryConfig[country].language);
};

// The currency is the one stored on the gym; switching language never changes it.
const applyGymLocale = (user: User): void => {
  if (user.gymCurrency) setCurrency(user.gymCurrency);
  if (user.gymCountry) applyGymCountryLanguage(user.gymCountry);
};

// The signed-in user; also used right after sign-in so the locale is applied before the first screen.
export const fetchSession = async (): Promise<User> => {
  const user = await meService.get();
  applyGymLocale(user);
  return user;
};

export const useSession = (): UseSessionResult => {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchSession,
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
