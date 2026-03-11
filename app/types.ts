export interface Station {
  code: string;
  name: string;
  brand: string;
  address: string;
  location: string; // suburb
  state: string;
  lat?: number;
  lng?: number;
}

export interface Price {
  stationcode: string;
  fueltype: string;
  price: number;
  lastupdated: string;
}

export interface FuelApiResponse {
  stations: Station[];
  prices: Price[];
}

export interface StationWithPrice {
  code: string;
  name: string;
  brand: string;
  address: string;
  suburb: string;
  price: number;
  lastupdated: string;
}

export interface FuelSearchResult {
  stations: StationWithPrice[];
  average: number;
  cheapest: number;
  mostExpensive: number;
  maxSaving: number;
  fuelType: string;
  postcode: string;
  fetchedAt: string;
}

export const FUEL_TYPES: Record<string, string> = {
  E10:  'E10 — Ethanol 94',
  U91:  'ULP — Unleaded 91',
  P95:  'Premium 95',
  P98:  'Premium 98',
  DL:   'Diesel',
  PDL:  'Premium Diesel',
  LPG:  'LPG',
  B20:  'Biodiesel B20',
  E85:  'E85',
};
