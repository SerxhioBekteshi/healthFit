import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { t } from '@/i18n';
import { LockersSection } from './LockersSection';
import { MemberCardsSection } from './MemberCardsSection';

type Tab = 'cards' | 'lockers';

export const CardsLockersPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('cards');

  return (
    <>
      <PageHeader
        title={t('Cards')}
        accent={t('& lockers')}
        // description={t(
        //   'Member cards for the door, and the lockers of your changing room.'
        // )}
      />

      <div className="mb-5">
        <Segmented
          label={t('Section')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'cards', label: t('Cards') },
            { value: 'lockers', label: t('Lockers') },
          ]}
        />
      </div>

      {tab === 'cards' ? <MemberCardsSection /> : <LockersSection />}
    </>
  );
};
