import { randomBytes } from 'node:crypto';
import type { PaymentMethod } from '@prisma/client';
import type { CardSummary } from '@gym/shared/types';

const BRAND_LABELS: Record<CardSummary['brand'], string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
};

// Only the brand and last 4 digits are ever recorded; the full number never reaches the API.
export const withCard = (description: string, card?: CardSummary): string =>
  card
    ? `${description} (${BRAND_LABELS[card.brand]} ending ${card.last4})`
    : description;

export const cardMetadata = (card?: CardSummary): Record<string, string> =>
  card ? { cardBrand: card.brand, cardLast4: card.last4 } : {};

export type ProviderStatus = 'succeeded' | 'pending' | 'failed';

export interface PaymentIntent {
  amount: number;
  clientId: string;
  description: string;
  metadata: Record<string, string>;
}

export interface PaymentResult {
  status: ProviderStatus;
  providerReference: string;
  message: string;
}

export interface PaymentProvider {
  charge(intent: PaymentIntent): Promise<PaymentResult>;
}

const reference = (prefix: string): string =>
  `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;

// Simulated providers. The server decides the outcome; replace card/online with a real
// provider whose result is confirmed by webhook before marking anything paid.
const providers: Record<Exclude<PaymentMethod, 'balance'>, PaymentProvider> = {
  cash: {
    charge: async () => ({
      status: 'succeeded',
      providerReference: reference('CASH'),
      message: 'Cash accepted at counter.',
    }),
  },
  card: {
    charge: async () => ({
      status: 'succeeded',
      providerReference: reference('CARD'),
      message: 'Card charged successfully.',
    }),
  },
  online: {
    charge: async () => ({
      status: 'succeeded',
      providerReference: reference('ONLINE'),
      message: 'Online payment confirmed.',
    }),
  },
  bank_transfer: {
    charge: async () => ({
      status: 'pending',
      providerReference: reference('BANK'),
      message: 'Bank transfer registered. Awaiting bank confirmation.',
    }),
  },
};

export const chargePayment = (
  method: Exclude<PaymentMethod, 'balance'>,
  intent: PaymentIntent
): Promise<PaymentResult> => providers[method].charge(intent);
