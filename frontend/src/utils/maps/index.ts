import type { GymLocation } from '@gym/shared/types';

// The owner's pasted Google Maps link wins; otherwise one is built from the pin.
export const locationMapLink = (
  location: Pick<GymLocation, 'latitude' | 'longitude' | 'mapUrl'>
): string | null => {
  if (location.mapUrl) return location.mapUrl;
  if (location.latitude == null || location.longitude == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
};
