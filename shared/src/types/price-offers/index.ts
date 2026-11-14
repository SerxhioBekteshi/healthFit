// `scheduled` starts later, `ended` is over; `paused` was switched off by the owner.
export type PriceOfferStatus = 'scheduled' | 'active' | 'ended' | 'paused';

export interface PriceOfferItem {
  planId: string;
  planName: string;
  // The plan's regular price now, to show what the offer saves.
  regularPrice: number;
  price: number;
}

export interface PriceOffer {
  id: string;
  gymId: string;
  name: string;
  // YYYY-MM-DD in the gym's timezone, both days included.
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: PriceOfferStatus;
  items: PriceOfferItem[];
  createdAt: string;
  updatedAt: string;
}

// The offer in force for a plan today (the lowest if several apply).
export interface PlanOffer {
  id: string;
  name: string;
  price: number;
  startDate: string;
  endDate: string;
}
