import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LocationCard } from '@/components/locations/LocationCard';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Screen } from '@/components/ui/Screen';
import { useGymLocations } from '@/hooks/gym-locations';
import { useRefresh } from '@/hooks/refresh';
import { useTranslation } from '@/i18n';

export default function LocationsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const locations = useGymLocations();
  const { refreshing, onRefresh } = useRefresh(locations.refetch);

  return (
    <Screen
      edges={['bottom']}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      <QueryBoundary query={locations}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              icon="location-outline"
              title={t('No locations yet')}
              message={t('Your gym has not added its addresses.')}
            />
          ) : (
            <>
              {list.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </>
          )
        }
      </QueryBoundary>
    </Screen>
  );
}
