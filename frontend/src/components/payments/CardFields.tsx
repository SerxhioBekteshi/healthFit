import React, { useEffect, useId, useState } from 'react';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import {
  detectBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  validateCard,
  type CardInput,
} from '@/utils/card';
import type { CardBrand, CardSummary } from '@gym/shared/types';

interface CardFieldsProps {
  // Called with brand and last 4 digits once the card is valid, null otherwise.
  onChange: (card: CardSummary | null) => void;
  // Shows every error, e.g. after the client tried to pay with an incomplete card.
  showErrors?: boolean;
  // Number on top, then name beside expiry and CVC.
  compact?: boolean;
}

const BrandMark: React.FC<{ brand: CardBrand | null }> = ({ brand }) => {
  if (brand === 'visa') {
    return (
      <span
        aria-label="Visa"
        className="rounded bg-white px-1.5 py-0.5 text-[0.7rem] font-black italic tracking-tight text-[#1a1f71]"
      >
        VISA
      </span>
    );
  }
  if (brand === 'mastercard') {
    return (
      <svg aria-label="Mastercard" viewBox="0 0 32 20" className="h-5 w-8">
        <circle cx="12" cy="10" r="8" fill="#eb001b" />
        <circle cx="20" cy="10" r="8" fill="#f79e1b" fillOpacity="0.9" />
      </svg>
    );
  }
  return (
    <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-bone/35">
      {t('Visa / MC')}
    </span>
  );
};

// The number and CVC live only in this component's state; the API only receives brand and last 4.
export const CardFields: React.FC<CardFieldsProps> = ({
  onChange,
  showErrors = false,
  compact = false,
}) => {
  const id = useId();
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

  const set =
    (field: keyof CardInput, format: (value: string) => string = (v) => v) =>
    (event: React.ChangeEvent<HTMLInputElement>): void =>
      setCard((current) => ({
        ...current,
        [field]: format(event.target.value),
      }));

  const blur = (field: keyof CardInput) => (): void =>
    setTouched((current) => ({ ...current, [field]: true }));

  const error = (field: keyof CardInput): string | undefined =>
    showErrors || touched[field] ? errors[field] : undefined;

  return (
    <fieldset
      className={`rounded-xl border border-white/10 bg-white/[0.03] ${
        compact ? 'grid gap-3 p-3 sm:grid-cols-2' : 'space-y-3 p-4'
      }`}
    >
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-bone/45">
        {t('Card details')}
      </legend>

      <div className={compact ? 'sm:col-span-2' : undefined}>
        <FormField
          id={`${id}-number`}
          label={t('Card number')}
          error={error('number')}
        >
          <div className="relative">
            <input
              id={`${id}-number`}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              className={`${fieldInputClass} pr-16 tabular-nums`}
              value={card.number}
              onChange={set('number', formatCardNumber)}
              onBlur={blur('number')}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <BrandMark brand={brand} />
            </span>
          </div>
        </FormField>
      </div>

      <FormField
        id={`${id}-name`}
        label={t('Name on card')}
        error={error('name')}
      >
        <input
          id={`${id}-name`}
          autoComplete="cc-name"
          placeholder={t('As printed on the card')}
          className={fieldInputClass}
          value={card.name}
          onChange={set('name')}
          onBlur={blur('name')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id={`${id}-expiry`}
          label={t('Expires')}
          error={error('expiry')}
        >
          <input
            id={`${id}-expiry`}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder={t('MM/YY')}
            className={`${fieldInputClass} tabular-nums`}
            value={card.expiry}
            onChange={set('expiry', formatExpiry)}
            onBlur={blur('expiry')}
          />
        </FormField>
        <FormField id={`${id}-cvc`} label="CVC" error={error('cvc')}>
          <input
            id={`${id}-cvc`}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={3}
            className={`${fieldInputClass} tabular-nums`}
            value={card.cvc}
            onChange={set('cvc', (value) => digitsOnly(value).slice(0, 3))}
            onBlur={blur('cvc')}
          />
        </FormField>
      </div>

      <p className={`text-xs text-bone/40 ${compact ? 'sm:col-span-2' : ''}`}>
        {t(
          'Checked in your browser. Only the card brand and last 4 digits are sent; this demo does not charge a real card.'
        )}
      </p>
    </fieldset>
  );
};
