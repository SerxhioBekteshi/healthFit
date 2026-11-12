import { describe, expect, it } from 'vitest';
import {
  createMembershipSchema,
  renewMembershipSchema,
} from '@gym/shared/validation/memberships';

const base = { clientId: 'c1', planId: 'p1', startDate: '2026-11-04' };

describe('staff membership schemas', () => {
  it('accept only cash, because members pay other ways in their own app', () => {
    expect(
      createMembershipSchema.safeParse({ ...base, paymentMethod: 'cash' })
        .success
    ).toBe(true);
    for (const method of ['card', 'balance', 'bank_transfer', 'online']) {
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
