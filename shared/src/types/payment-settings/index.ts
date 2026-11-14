// How a gym lets members pay. Each switch is on by default; the owner turns them off.
export interface PaymentSettings {
  // Card payments (members online, staff at the counter).
  acceptCard: boolean;
  // Credit on the member's account at the gym (balance and top-ups).
  acceptBalance: boolean;
  // Cash taken at the counter.
  acceptCash: boolean;
}
