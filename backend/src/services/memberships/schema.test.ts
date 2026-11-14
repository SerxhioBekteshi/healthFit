import { describe, expect, it } from 'vitest';
import {
  createMembershipSchema,
  renewMembershipSchema,
} from '@gym/shared/validation/memberships';

const base = { clientId: 'c1', planId: 'p1', startDate: '2026-11-04' };
const card = { brand: 'visa', last4: '4242' };

describe('staff membership schemas', () => {
  it('accept cash, card (with its summary) and balance at the counter', () => {
    for (const paymentMethod of ['cash', 'balance']) {
      expect(
        createMembershipSchema.safeParse({ ...base, paymentMethod }).success
      ).toBe(true);
      expect(
        renewMembershipSchema.safeParse({
          startDate: base.startDate,
          paymentMethod,
        }).success
      ).toBe(true);
    }
    expect(
      createMembershipSchema.safeParse({
        ...base,
        paymentMethod: 'card',
        card,
      }).success
    ).toBe(true);
    expect(
      createMembershipSchema.safeParse({ ...base, paymentMethod: 'card' })
        .success
    ).toBe(false);
  });

  it('refuse methods that are not a counter payment', () => {
    for (const method of ['bank_transfer', 'online']) {
      expect(
        createMembershipSchema.safeParse({ ...base, paymentMethod: method })
          .success
      ).toBe(false);
      expect(
        renewMembershipSchema.safeParse({
          startDate: base.startDate,
          paymentMethod: method,
        }).success
      ).toBe(false);
    }
  });
});
