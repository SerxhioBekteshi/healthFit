export interface MemberCard {
  id: string;
  clientId: string;
  clientName: string;
  // What the reader sends; unique within the gym.
  number: string;
  // A member has one active card; a replaced or blocked card stays on record.
  isActive: boolean;
  issuedAt: string;
  deactivatedAt: string | null;
}
