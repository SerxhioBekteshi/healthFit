import React from 'react';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useJoinGym } from '@/hooks/community';
import { useTranslation } from '@/i18n';
import type { CommunityGym } from '@gym/shared/types';

interface JoinGymSheetProps {
  // The gym being confirmed; the sheet is closed while it is null.
  gym: CommunityGym | null;
  onClose: () => void;
}

// Asks before the member becomes a client of the gym they picked.
export const JoinGymSheet: React.FC<JoinGymSheetProps> = ({ gym, onClose }) => {
  const { t } = useTranslation();
  const join = useJoinGym();

  const close = (): void => {
    join.reset();
    onClose();
  };

  return (
    <BottomSheet
      visible={gym !== null}
      title={t('Start at {{gym}}?', { gym: gym?.name ?? '' })}
      description={t(
        'You become a member of this gym with the details you signed up with. You can then buy a membership and check in.'
      )}
      onClose={close}
      submitLabel={t('Start here')}
      onSubmit={() => {
        if (gym) join.mutate(gym.id, { onSuccess: close });
      }}
      isSubmitting={join.isPending}
    >
      {join.error ? (
        <Banner tone="danger" message={join.error.message} />
      ) : null}
    </BottomSheet>
  );
};
