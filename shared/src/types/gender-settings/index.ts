// Whether a gym keeps one configuration for both men and women, or sets each separately.
export interface GenderSettings {
  // Standard membership prices are the same for men and women.
  samePricesForGenders: boolean;
  // Locker ranges are mirrored between the men's and women's changing room.
  sameLockersForGenders: boolean;
}
