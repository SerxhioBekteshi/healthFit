import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useAccessSettings } from '@/hooks/access-settings';
import { useCheckOut } from '@/hooks/attendance';
import { useLockerActions } from '@/hooks/lockers';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import type { ClientDashboard } from '@gym/shared/types';

interface AccessPanelProps {
  data: Pick<ClientDashboard, 'card' | 'checkedIn' | 'locker'>;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.md },
    facts: { flexDirection: 'row', gap: theme.spacing.lg },
    fact: { flex: 1, gap: 2 },
    lockerForm: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
    },
    grow: { flex: 1 },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
  });

// The member's card, whether they are inside, and which locker holds their things.
export const AccessPanel: React.FC<AccessPanelProps> = ({ data }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const settings = useAccessSettings();
  const checkOut = useCheckOut();
  const { assignLocker, releaseLocker } = useLockerActions();
  const [lockerNumber, setLockerNumber] = useState('');

  const canPickLocker =
    !settings.lockersUseCard && data.checkedIn && !data.locker;
  const error =
    checkOut.error ?? assignLocker.error ?? releaseLocker.error ?? null;

  const saveLocker = (): void => {
    assignLocker.mutate(lockerNumber.trim(), {
      onSuccess: () => setLockerNumber(''),
    });
  };

  return (
    <Card style={styles.stack}>
      <View style={styles.facts}>
        {settings.cardsEnabled ? (
          <View style={styles.fact}>
            <Text variant="label" tone="muted">
              {t('MY CARD')}
            </Text>
            <Text variant="mono">{data.card ?? t('No card yet')}</Text>
          </View>
        ) : null}
        <View style={styles.fact}>
          <Text variant="label" tone="muted">
            {t('MY LOCKER')}
          </Text>
          <Text variant="mono">
            {data.locker
              ? data.locker.lockerNumber
              : data.checkedIn
                ? t('None yet')
                : '—'}
          </Text>
          {data.locker?.locationName ? (
            <Text variant="caption" tone="subtle">
              {data.locker.locationName}
            </Text>
          ) : null}
        </View>
      </View>

      {settings.lockersUseCard && data.checkedIn && !data.locker ? (
        <Text variant="caption" tone="muted">
          {t('Lock a locker with your card and its number shows here.')}
        </Text>
      ) : null}

      {canPickLocker ? (
        <View style={styles.lockerForm}>
          <View style={styles.grow}>
            <TextField
              label={t('Locker number')}
              placeholder={t('Which locker are you using?')}
              value={lockerNumber}
              onChangeText={setLockerNumber}
              onSubmitEditing={saveLocker}
              autoCapitalize="characters"
            />
          </View>
          <Button
            label={t('Save')}
            size="sm"
            variant="secondary"
            loading={assignLocker.isPending}
            disabled={lockerNumber.trim() === ''}
            onPress={saveLocker}
          />
        </View>
      ) : null}

      {error ? <Banner tone="danger" message={error.message} /> : null}

      {data.checkedIn ? (
        <View style={styles.actions}>
          {data.locker && !settings.lockersUseCard ? (
            <Button
              label={t('Free my locker')}
              size="sm"
              variant="ghost"
              loading={releaseLocker.isPending}
              onPress={() => releaseLocker.mutate()}
            />
          ) : null}
          <Button
            label={t('Check out')}
            size="sm"
            variant="secondary"
            icon="log-out-outline"
            loading={checkOut.isPending}
            onPress={() => checkOut.mutate()}
          />
        </View>
      ) : null}
    </Card>
  );
};
