export interface Address {
  street: string;
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
}

export interface Package {
  weightLb: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
}

export interface RateRequest {
  origin: Address;
  destination: Address;
  packages: Package[];
  serviceCode?: string;
}

export interface RateQuote {
  carrier: string;
  serviceCode: string;
  serviceName: string;
  totalChargeUSD: number;
  currency: string;
  estimatedDays?: number;
}