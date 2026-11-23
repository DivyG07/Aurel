// Onboarding / preference answers — shared by the onboarding wizard, account settings and server actions.

export const BUDGETS = [
  { key: "UNDER_250K", label: "Under $250k" },
  { key: "250K_500K", label: "$250k – $500k" },
  { key: "500K_1M", label: "$500k – $1M" },
  { key: "OVER_1M", label: "$1M +" },
] as const;

export const INTERESTS = [
  { key: "BUYING", label: "Buying my next car", icon: "🔑" },
  { key: "SELLING", label: "Selling a car", icon: "💼" },
  { key: "AUCTIONS", label: "Bidding at auctions", icon: "🔨" },
  { key: "COLLECTING", label: "Building a collection", icon: "🏛" },
  { key: "COMMUNITY", label: "Talking cars with the community", icon: "💬" },
  { key: "JUST_LOOKING", label: "Just here to admire", icon: "👀" },
] as const;

export const OWNED = [
  { key: "NONE", label: "None yet" },
  { key: "ONE_TO_THREE", label: "1 – 3" },
  { key: "FOUR_TO_TEN", label: "4 – 10" },
  { key: "TEN_PLUS", label: "10 +" },
] as const;

export const keys = <T extends readonly { key: string }[]>(list: T) => list.map((x) => x.key) as string[];

export function parseList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
