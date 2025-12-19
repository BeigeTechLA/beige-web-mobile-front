import type { LocationObject } from '../redux/features/booking/guestBookingApi';

/**
 * Safely format a location object for display
 * Returns just the address string, or a fallback message
 */
export function formatLocationForDisplay(location: LocationObject | null | undefined): string {
  if (!location) {
    return 'Location not specified';
  }

  if (location.address) {
    return location.address;
  }

  if (location.coordinates) {
    return `${location.coordinates.lat}, ${location.coordinates.lng}`;
  }

  return 'Location not specified';
}

/**
 * Check if location has valid coordinates
 */
export function hasValidCoordinates(location: LocationObject | null | undefined): boolean {
  return Boolean(location && location.hasCoordinates && location.coordinates);
}
