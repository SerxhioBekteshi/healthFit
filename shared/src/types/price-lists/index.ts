export interface PriceListPhoto {
  id: string;
  // Path under the API origin, e.g. /uploads/<gymId>/<file>.jpg
  url: string;
  createdAt: string;
}

export interface PriceList {
  notes: string[];
  photos: PriceListPhoto[];
}
