import type { GymLocation } from '@gym/shared/types';

// The link the owner pasted from Google Maps, otherwise a search for the pin; null when the location has neither.
export const mapUrl = (location: GymLocation): string | null => {
  if (location.mapUrl) return location.mapUrl;
  if (location.latitude === null || location.longitude === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
};
