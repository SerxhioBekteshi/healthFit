import React, { useState } from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ChangePasswordSheet } from '@/components/settings/ChangePasswordSheet';
import { OptionSheet } from '@/components/settings/OptionSheet';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { useConfirmSignOut } from '@/hooks/auth';
import { useClientDashboard } from '@/hooks/dashboard';
import { useMoney } from '@/hooks/money';
import { LANGUAGES, languageNames, setLanguage, useTranslation } from '@/i18n';
import { useSession } from '@/providers/SessionProvider';
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from '@/theme/preference';

type OpenSheet = 'language' | 'appearance' | 'password' | null;

export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const { t, language } = useTranslation();
  const confirmSignOut = useConfirmSignOut();
  const { user } = useSession();
  const formatMoney = useMoney();
  const balance = useClientDashboard().data?.balance;
  const { preference } = useThemePreference();
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const close = (): void => setSheet(null);

  const themeTitles: Record<ThemePreference, string> = {
    system: t('Same as phone'),
    light: t('Light'),
    dark: t('Dark'),
  };

  return (
    <Screen title={t('Profile')}>
      {user ? <ProfileHeader user={user} /> : null}

      <ListGroup>
        <ListRow
          icon="wallet-outline"
          title={t('Balance')}
          subtitle={t('Credit, top-ups and payments')}
          trailing={
            balance === undefined ? undefined : (
              <Text variant="bodyStrong">{formatMoney(balance)}</Text>
            )
          }
          onPress={() => router.push('/balance')}
        />
        <ListRow
          icon="time-outline"
          title={t('My visits')}
          subtitle={t('Every check-in and check-out')}
          onPress={() => router.push('/attendance')}
        />
        <ListRow
          icon="cart-outline"
          title={t('Gym shop')}
          subtitle={t('Purchase from the gym using your balance.')}
          onPress={() => router.push('/products')}
        />
        <ListRow
          icon="location-outline"
          title={t('Gym locations')}
          subtitle={t('Addresses, directions and phone numbers')}
          onPress={() => router.push('/locations')}
        />
      </ListGroup>

      <SectionHeader title={t('Settings')} />
      <ListGroup>
        <ListRow
          icon="language-outline"
          title={t('Language')}
          trailing={
            <Text variant="caption" tone="muted">
              {languageNames[language]}
            </Text>
          }
          onPress={() => setSheet('language')}
        />
        <ListRow
          icon="contrast-outline"
          title={t('Appearance')}
          trailing={
            <Text variant="caption" tone="muted">
              {themeTitles[preference]}
            </Text>
          }
          onPress={() => setSheet('appearance')}
        />
        <ListRow
          icon="lock-closed-outline"
          title={t('Change password')}
          onPress={() => setSheet('password')}
        />
      </ListGroup>

      <ListGroup>
        <ListRow
          icon="log-out-outline"
          title={t('Sign out')}
          destructive
          onPress={confirmSignOut}
        />
      </ListGroup>

      <Text variant="caption" tone="subtle" align="center">
        {t('Version {{version}}', {
          version: Constants.expoConfig?.version ?? '1.0.0',
        })}
      </Text>

      <OptionSheet
        visible={sheet === 'language'}
        title={t('Language')}
        options={LANGUAGES.map((value) => ({
          value,
          title: languageNames[value],
        }))}
        value={language}
        onSelect={(value) => setLanguage(value, { remember: true })}
        onClose={close}
      />
      <OptionSheet
        visible={sheet === 'appearance'}
        title={t('Appearance')}
        options={(['system', 'light', 'dark'] as const).map((value) => ({
          value,
          title: themeTitles[value],
        }))}
        value={preference}
        onSelect={setThemePreference}
        onClose={close}
      />
      <ChangePasswordSheet visible={sheet === 'password'} onClose={close} />
    </Screen>
  );
}
