import { useTranslation } from '@/i18n';
import { useSession } from '@/providers/SessionProvider';
import { formatMoney } from '@/utils/format';

// Amounts show in the gym's currency (ALL, EUR or GBP) and are never converted;
// the number format follows the language, so this redraws when the language changes.
export const useMoney = (): ((amount: number) => string) => {
  useTranslation();
  const currency = useSession().user?.gymCurrency ?? null;
  return (amount) => formatMoney(amount, currency);
};
