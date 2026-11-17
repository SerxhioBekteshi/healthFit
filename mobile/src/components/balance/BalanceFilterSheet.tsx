import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import type { BalanceHistoryFilters } from '@gym/shared/types';
import { balanceHistoryQuerySchema } from '@gym/shared/validation/balance';

interface BalanceFilterSheetProps {
  visible: boolean;
  // The filters in force; the sheet edits a copy and hands it back with "Apply".
  value: BalanceHistoryFilters;
  onApply: (filters: BalanceHistoryFilters) => void;
  onClose: () => void;
}

interface Draft {
  from?: string;
  to?: string;
  // Amounts are typed, so they are kept as text until applied.
  min: string;
  max: string;
}

type OpenCalendar = 'from' | 'to' | null;

const toDraft = (filters: BalanceHistoryFilters): Draft => ({
  from: filters.from,
  to: filters.to,
  min: filters.minAmount === undefined ? '' : String(filters.minAmount),
  max: filters.maxAmount === undefined ? '' : String(filters.maxAmount),
});

// "12,5" and "12.5" both work, as on a phone keyboard; empty means no limit.
const toAmount = (text: string): number | undefined =>
  text.trim() === '' ? undefined : Number(text.replace(',', '.'));

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.md },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    half: { flex: 1 },
    clear: { alignSelf: 'flex-start' },
  });

// Date range and amount range of the transaction history, like the Filter panel of the web app.
export const BalanceFilterSheet: React.FC<BalanceFilterSheetProps> = ({
  visible,
  value,
  onApply,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Draft>(() => toDraft(value));
  const [wasVisible, setWasVisible] = useState(visible);
  const [openCalendar, setOpenCalendar] = useState<OpenCalendar>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // Every time the sheet opens it starts from the filters in force.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(toDraft(value));
      setOpenCalendar(null);
      setProblem(null);
    }
  }

  const toggle = (which: Exclude<OpenCalendar, null>) => () =>
    setOpenCalendar(openCalendar === which ? null : which);

  const apply = (): void => {
    const candidate: BalanceHistoryFilters = {
      from: draft.from,
      to: draft.to,
      minAmount: toAmount(draft.min),
      maxAmount: toAmount(draft.max),
    };
    // The shared schema is the one the API uses, so a range it would refuse never leaves the phone.
    const parsed = balanceHistoryQuerySchema.safeParse(candidate);
    if (!parsed.success) {
      setProblem(
        t(
          parsed.error.issues[0]?.message ??
            'Validation failed. Please check your input.'
        )
      );
      return;
    }
    onApply(candidate);
    onClose();
  };

  const nothingSet =
    !draft.from && !draft.to && draft.min === '' && draft.max === '';

  return (
    <BottomSheet
      visible={visible}
      title={t('Filter')}
      onClose={onClose}
      submitLabel={t('Apply')}
      onSubmit={apply}
    >
      <View style={styles.stack}>
        <DateField
          label={t('From date')}
          value={draft.from}
          onChange={(from) => setDraft({ ...draft, from })}
          open={openCalendar === 'from'}
          onToggle={toggle('from')}
        />
        <DateField
          label={t('To date')}
          value={draft.to}
          onChange={(to) => setDraft({ ...draft, to })}
          open={openCalendar === 'to'}
          onToggle={toggle('to')}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label={t('Min amount')}
              placeholder="0"
              keyboardType="decimal-pad"
              value={draft.min}
              onChangeText={(min) => setDraft({ ...draft, min })}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label={t('Max amount')}
              placeholder={t('Any')}
              keyboardType="decimal-pad"
              value={draft.max}
              onChangeText={(max) => setDraft({ ...draft, max })}
            />
          </View>
        </View>
        {problem ? (
          <Text variant="caption" tone="danger">
            {problem}
          </Text>
        ) : (
          <Text variant="caption" tone="subtle">
            {t('Amounts match money in and money out alike.')}
          </Text>
        )}
        <View style={styles.clear}>
          <Button
            label={t('Clear')}
            size="sm"
            variant="ghost"
            disabled={nothingSet}
            onPress={() => {
              setDraft({ min: '', max: '' });
              setProblem(null);
              setOpenCalendar(null);
            }}
          />
        </View>
      </View>
    </BottomSheet>
  );
};
