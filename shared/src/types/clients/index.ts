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
  createdAt: string;
  updatedAt: string;
}
