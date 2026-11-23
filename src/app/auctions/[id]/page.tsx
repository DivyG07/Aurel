import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuction } from "@/lib/auctions";
import { currentUser } from "@/lib/session";
import { AuctionRoom } from "@/components/auction/AuctionRoom";
import { db } from "@/lib/db";
import { depositRequired } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const a = await getAuction((await params).id);
  return a ? { title: `Auction · ${a.car.brand} ${a.car.model}` } : {};
}

export default async function AuctionPage({ params }: Params) {
  const { id } = await params;
  const [auction, user] = await Promise.all([getAuction(id), currentUser()]);
  if (!auction) notFound();
  const me = user ? await db.user.findUnique({ where: { id: user.id }, select: { verifiedBidder: true } }) : null;
  return <AuctionRoom initial={auction} userId={user?.id ?? null} needsDeposit={!!user && depositRequired() && !me?.verifiedBidder} />;
}
