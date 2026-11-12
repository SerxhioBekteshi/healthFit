import React, { Suspense, lazy } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGymLocations } from '@/hooks/gym-locations';
import { t } from '@/i18n';
import { locationMapLink } from '@/utils/maps';

// The map library is large, so it loads after the list is on screen.
const LocationMap = lazy(() =>
  import('@/components/gym-locations/LocationMap').then((module) => ({
    default: module.LocationMap,
  }))
);

export const ClientLocationsPage: React.FC = () => {
  const { locations, isLoading, error } = useGymLocations();

  return (
    <>
      <PageHeader
        eyebrow={t('Member area')}
        title={t('Our')}
        accent={t('gyms')}
        description={t(
          'Your membership works at every gym below. Train wherever suits you; the gym records the visit when you check in.'
        )}
      />

      {error ? <Alert>{error.message}</Alert> : null}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          {[0, 1].map((item) => (
            <Skeleton key={item} className="h-32" />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && locations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-bone/55">
          {t('No gyms are open right now.')}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {locations.map((location) => {
          const link = locationMapLink(location);
          return (
            <Card key={location.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-signal/10 text-signal">
                  <Icon name="pin" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-bone">{location.name}</p>
                  <p className="mt-1 text-sm text-bone/60">
                    {location.address}
                  </p>
                  {location.phone ? (
                    <a
                      href={`tel:${location.phone.replace(/\s+/g, '')}`}
                      className="mt-1 block text-sm text-signal hover:underline"
                    >
                      {location.phone}
                    </a>
                  ) : null}
                </div>
              </div>

              {location.latitude != null && location.longitude != null ? (
                <div className="mt-4">
                  <Suspense fallback={<Skeleton className="h-44" />}>
                    <LocationMap
                      latitude={location.latitude}
                      longitude={location.longitude}
                    />
                  </Suspense>
                </div>
              ) : null}
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-signal hover:underline"
                >
                  {t('Open in Google Maps')}
                  <Icon name="arrow-right" className="h-4 w-4" />
                </a>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
};
