"use server";

import { auth } from "@/auth";
import { BidError, placeBid } from "@/lib/auctions";

export async function bid(auctionId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, message: "Sign in to bid.", needsLogin: true };
  try {
    const { extended } = await placeBid(auctionId, session.user.id, Math.round(amount));
    return { ok: true as const, message: extended ? "Bid placed. Clock extended — anti-snipe protection." : "Bid placed. You're the highest bidder." };
  } catch (e) {
    if (e instanceof BidError) return { ok: false as const, message: e.message };
    console.error(e);
    return { ok: false as const, message: "Something went wrong placing your bid. Please try again." };
  }
}
