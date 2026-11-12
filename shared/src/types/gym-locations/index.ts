export interface GymLocation {
  id: string;
  gymId: string;
  name: string;
  address: string;
  phone: string;
  // Null for locations created before coordinates existed; the owner picks them on the map.
  latitude: number | null;
  longitude: number | null;
  // Link the owner pasted from Google Maps; empty when none.
  mapUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
