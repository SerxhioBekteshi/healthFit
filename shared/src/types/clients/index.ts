export type Gender = 'male' | 'female';

export interface Client {
  id: string;
  gymId: string;
  fullName: string;
  email: string;
  phone: string;
  // null for members created before gender was collected.
  gender: Gender | null;
  isActive: boolean;
  // False until the client has a password (created without one, waiting for the invite link).
  hasLogin: boolean;
  createdAt: string;
  updatedAt: string;
}
