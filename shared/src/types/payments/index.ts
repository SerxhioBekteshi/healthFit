export type PaymentMethod =
  'cash' | 'card' | 'bank_transfer' | 'online' | 'balance';

export type PaymentProviderStatus = 'paid' | 'pending' | 'failed';

export type CardBrand = 'visa' | 'mastercard';

// All the API ever learns about a card: the number and CVC stay in the browser.
export interface CardSummary {
  brand: CardBrand;
  last4: string;
}
