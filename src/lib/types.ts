// Serializable view models shared between server and client components.

export type BodyType = "HYPER" | "GT" | "SEDAN" | "SUV";
export type CarStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "AUCTION" | "COMING_SOON";
export type Finish = "GLOSS" | "METALLIC" | "MATTE" | "PEARL";

export interface ColorView {
  id: string;
  name: string;
  hex: string;
  finish: Finish;
  kind: "EXTERIOR" | "INTERIOR" | "CALIPER";
  priceDelta: number;
}

export interface VariantView {
  id: string;
  name: string;
  priceDelta: number;
  powerHp: number | null;
  torqueNm: number | null;
  zeroToHundred: number | null;
  topSpeedKmh: number | null;
  note: string | null;
}

export interface PhotoView {
  url: string;
  credit: string | null;
}

export interface CarView {
  id: string;
  slug: string;
  brand: { slug: string; name: string; country: string; accentHex: string };
  model: string;
  year: number;
  tagline: string;
  description: string;
  bodyType: BodyType;
  heroImage: string | null;
  heroCredit: string | null;
  photos: PhotoView[];
  sketchfabUid: string | null;
  sketchfabCredit: string | null;
  sketchfabPaint: string[];
  configuratorUrl: string | null;
  priceFrom: number;
  status: CarStatus;
  featured: boolean;
  specs: {
    engine: string;
    powerHp: number;
    torqueNm: number;
    zeroToHundred: number;
    topSpeedKmh: number;
    drivetrain: string;
    transmission: string;
    seats: number;
    weightKg: number | null;
  };
  colors: ColorView[];
  variants: VariantView[];
  priceHistory: { date: string; priceUsd: number }[];
}

export type AuctionPhase = "UPCOMING" | "LIVE" | "ENDED" | "CANCELLED" | "PENDING" | "REJECTED";

export interface BidView {
  id: string;
  amount: number;
  bidder: string; // masked display name
  userId: string;
  at: string;
}

export interface AuctionView {
  id: string;
  title: string;
  phase: AuctionPhase;
  startsAt: string;
  endsAt: string;
  startingBid: number;
  bidIncrement: number;
  reserveMet: boolean;
  hasReserve: boolean;
  currentBid: number | null;
  nextMinBid: number;
  bidCount: number;
  bids: BidView[];
  /** HOUSE = AUREL's own lot; DEALER = first-hand (new) from a dealer; COLLECTOR = second-hand from a private owner. */
  listingType: "HOUSE" | "DEALER" | "COLLECTOR";
  seller: { id: string; name: string } | null;
  details: { mileageKm: number | null; condition: string | null; description: string | null; location: string | null };
  images: string[];
  car: {
    slug: string | null; // null for member-listed cars that aren't in the catalogue
    model: string;
    year: number | null;
    brand: string;
    brandSlug: string | null;
    heroImage: string | null;
    heroCredit: string | null;
    sketchfabUid: string | null;
    sketchfabCredit: string | null;
    specs: CarView["specs"] | null;
  };
}

export const listingTypeLabel: Record<AuctionView["listingType"], string> = {
  HOUSE: "AUREL House Sale",
  DEALER: "Dealer · First-hand",
  COLLECTOR: "Collector · Pre-owned",
};

export const conditionLabel: Record<string, string> = {
  NEW: "New / delivery miles",
  EXCELLENT: "Excellent",
  VERY_GOOD: "Very good",
  GOOD: "Good",
  PROJECT: "Project / needs work",
};

export const bodyTypeLabel: Record<BodyType, string> = {
  HYPER: "Hypercar",
  GT: "Grand Tourer",
  SEDAN: "Saloon",
  SUV: "Luxury SUV",
};

export const statusLabel: Record<CarStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  AUCTION: "At Auction",
  COMING_SOON: "Arriving Soon",
};
