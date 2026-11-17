import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import {
  detectBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  validateCard,
  type CardInput,
} from '@/utils/card';
import type { CardSummary } from '@gym/shared/types';

interface CardFieldsProps {
  // Called with brand and last 4 digits once the card is valid, null otherwise.
  onChange: (card: CardSummary | null) => void;
  // Shows every error, for example after the member tried to pay with an incomplete card.
  showErrors?: boolean;
}

const brandNames = { visa: 'VISA', mastercard: 'MASTERCARD' } as const;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.md },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    half: { flex: 1 },
  });

// The number and CVC only live in this component's state; the API only ever receives brand and last 4.
export const CardFields: React.FC<CardFieldsProps> = ({
  onChange,
  showErrors = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [card, setCard] = useState<CardInput>({
    name: '',
    number: '',
    expiry: '',
    cvc: '',
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof CardInput, boolean>>
  >({});

  const digits = digitsOnly(card.number);
  const brand = detectBrand(digits);
  const errors = validateCard(card);
  const valid = Object.keys(errors).length === 0 && brand !== null;
  const last4 = digits.slice(-4);

  useEffect(() => {
    onChange(valid && brand ? { brand, last4 } : null);
  }, [valid, brand, last4, onChange]);

  const edit =
    (field: keyof CardInput, format: (value: string) => string = (v) => v) =>
    (value: string): void =>
      setCard((current) => ({ ...current, [field]: format(value) }));

  const blur = (field: keyof CardInput) => (): void =>
    setTouched((current) => ({ ...current, [field]: true }));

  const error = (field: keyof CardInput): string | undefined =>
    showErrors || touched[field] ? errors[field] : undefined;

  return (
    <View style={styles.stack}>
      <TextField
        label={t('Card number')}
        placeholder="1234 5678 9012 3456"
        keyboardType="number-pad"
        autoComplete="cc-number"
        value={card.number}
        onChangeText={edit('number', formatCardNumber)}
        onBlur={blur('number')}
        error={error('number')}
        accessory={
          <Text variant="label" tone="subtle">
            {brand ? brandNames[brand] : t('Visa / MC')}
          </Text>
        }
      />
      <TextField
        label={t('Name on card')}
        placeholder={t('As printed on the card')}
        autoCapitalize="words"
        autoComplete="cc-name"
        value={card.name}
        onChangeText={edit('name')}
        onBlur={blur('name')}
        error={error('name')}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <TextField
            label={t('Expires')}
            placeholder={t('MM/YY')}
            keyboardType="number-pad"
            autoComplete="cc-exp"
            value={card.expiry}
            onChangeText={edit('expiry', formatExpiry)}
            onBlur={blur('expiry')}
            error={error('expiry')}
          />
        </View>
        <View style={styles.half}>
          <TextField
            label="CVC"
            placeholder="123"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={3}
            autoComplete="cc-csc"
            value={card.cvc}
            onChangeText={edit('cvc', (value) => digitsOnly(value).slice(0, 3))}
            onBlur={blur('cvc')}
            error={error('cvc')}
          />
        </View>
      </View>
      <Text variant="caption" tone="subtle">
        {t(
          'Checked on your phone. Only the card brand and the last 4 digits are sent; this demo does not charge a real card.'
        )}
      </Text>
    </View>
  );
};
