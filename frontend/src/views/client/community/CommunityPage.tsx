import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCommunityGyms, useJoinGym } from '@/hooks/community';
import { useConfirm } from '@/hooks/confirm';
import { t } from '@/i18n';
import { countryNames } from '@/utils/constants/countries';
import type { CommunityGym, CountryCode } from '@gym/shared/types';
import { COUNTRY_CODES } from '@gym/shared/validation/gyms';

type CountryFilter = CountryCode | 'all';

// Where a member who signed up without a gym looks around and chooses where to start.
export const CommunityPage: React.FC = () => {
  // Until the member picks one, the server suggests the gyms of the country they signed up in.
  const [picked, setPicked] = useState<CountryFilter | undefined>(undefined);
  const { data, isLoading, error } = useCommunityGyms(picked);
  const gyms = data?.gyms ?? [];
  const country: CountryFilter = picked ?? data?.country ?? 'all';
  const join = useJoinGym();
  const { confirm, dialog } = useConfirm();

  const askJoin = (gym: CommunityGym): void =>
    confirm({
      title: t('Start at {{gym}}?', { gym: gym.name }),
      description: t(
        'You become a member of this gym with the details you signed up with. You can then buy a membership and check in.'
      ),
      confirmLabel: t('Start here'),
      tone: 'primary',
      onConfirm: () => join.mutate(gym.id),
    });

  return (
    <>
      <PageHeader
        eyebrow={t('Community')}
        title={t('Find your')}
        accent={t('gym')}
        description={t(
          'You are not a member of a gym yet. Look at the gyms below and choose where to start.'
        )}
        actions={
          <FilterSelect
            label={t('Country')}
            value={country}
            onChange={setPicked}
            options={[
              ...COUNTRY_CODES.map((code) => ({
                value: code as CountryFilter,
                label: countryNames[code],
              })),
              { value: 'all' as CountryFilter, label: t('All countries') },
            ]}
          />
        }
      />

      {error ? <Alert>{error.message}</Alert> : null}
      {join.error ? <Alert className="mb-4">{join.error.message}</Alert> : null}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          {[0, 1].map((item) => (
            <Skeleton key={item} className="h-40" />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && gyms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-bone/55">
          <p>
            {country === 'all'
              ? t('No gyms are open right now.')
              : t('No gyms in {{country}} yet. Try another country.', {
                  country: countryNames[country],
                })}
          </p>
          {country !== 'all' ? (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setPicked('all')}
            >
              {t('Show all countries')}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {gyms.map((gym) => (
          <Card key={gym.id}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-signal/10 text-signal">
                <Icon name="pin" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-bone">{gym.name}</p>
                <p className="mt-1 text-sm text-bone/60">
                  {[gym.address, gym.location].filter(Boolean).join(', ')}
                </p>
                <p className="mt-1 text-sm text-bone/60">
                  {t('Open {{from}} to {{to}}', {
                    from: gym.opensAt,
                    to: gym.closesAt,
                  })}
                </p>
                {gym.contactPhone ? (
                  <a
                    href={`tel:${gym.contactPhone.replace(/\s+/g, '')}`}
                    className="mt-1 block text-sm text-signal hover:underline"
                  >
                    {gym.contactPhone}
                  </a>
                ) : null}
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              disabled={join.isPending}
              onClick={() => askJoin(gym)}
            >
              {t('Start here')}
            </Button>
          </Card>
        ))}
      </div>
      {dialog}
    </>
  );
};
