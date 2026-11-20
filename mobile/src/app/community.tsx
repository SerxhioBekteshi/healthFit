import React, { useState } from 'react';
import { GymCard } from '@/components/community/GymCard';
import { JoinGymSheet } from '@/components/community/JoinGymSheet';
import { Button } from '@/components/ui/Button';
import { ChoiceField } from '@/components/ui/ChoiceField';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useConfirmSignOut } from '@/hooks/auth';
import { useCommunityGyms } from '@/hooks/community';
import { useRefresh } from '@/hooks/refresh';
import { useTranslation } from '@/i18n';
import { countryCodes, countryNames } from '@/utils/countries';
import type { CommunityGym, CountryCode } from '@gym/shared/types';

type CountryFilter = CountryCode | 'all';

// The only screen of a member who signed up without a gym: look around, choose where to start, or sign out.
export default function CommunityScreen(): React.ReactElement {
  const { t } = useTranslation();
  // Until the member picks one, the server suggests the gyms of the country they signed up in.
  const [picked, setPicked] = useState<CountryFilter | undefined>(undefined);
  const gyms = useCommunityGyms(picked);
  const { refreshing, onRefresh } = useRefresh(gyms.refetch);
  const confirmSignOut = useConfirmSignOut();
  const [chosen, setChosen] = useState<CommunityGym | null>(null);

  const selected: CountryFilter | null =
    picked ?? (gyms.data ? (gyms.data.country ?? 'all') : null);

  return (
    <Screen
      edges={['bottom']}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      <Text variant="body" tone="muted">
        {t(
          'You are not a member of a gym yet. Look at the gyms below and choose where to start.'
        )}
      </Text>
      <ChoiceField<CountryFilter>
        label={t('Country')}
        options={[
          ...countryCodes.map((value) => ({
            value,
            label: countryNames[value],
          })),
          { value: 'all', label: t('All countries') },
        ]}
        value={selected}
        onChange={setPicked}
      />
      <QueryBoundary query={gyms}>
        {({ country, gyms: list }) =>
          list.length === 0 ? (
            <EmptyState
              icon="location-outline"
              title={
                country
                  ? t('No gyms in {{country}} yet. Try another country.', {
                      country: countryNames[country],
                    })
                  : t('No gyms are open right now.')
              }
              actionLabel={country ? t('Show all countries') : undefined}
              onAction={country ? () => setPicked('all') : undefined}
            />
          ) : (
            <>
              {list.map((gym) => (
                <GymCard key={gym.id} gym={gym} onStart={setChosen} />
              ))}
            </>
          )
        }
      </QueryBoundary>
      <Button
        label={t('Sign out')}
        icon="log-out-outline"
        variant="secondary"
        onPress={confirmSignOut}
        fullWidth
      />
      <JoinGymSheet gym={chosen} onClose={() => setChosen(null)} />
    </Screen>
  );
}
