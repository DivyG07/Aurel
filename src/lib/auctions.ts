import "server-only";
import { EventEmitter } from "node:events";
import { db } from "./db";
import { mirror } from "./sheets";
import type { AuctionPhase, AuctionView } from "./types";

// ─── Live event bus (single Node process; swap for Redis/Ably when scaling out) ──
const g = globalThis as unknown as { auctionBus?: EventEmitter; auctionWatchers?: Map<string, number> };
export const bus = g.auctionBus ?? (g.auctionBus = new EventEmitter().setMaxListeners(0));
export const watchers = g.auctionWatchers ?? (g.auctionWatchers = new Map());

const include = {
  car: { include: { brand: true } },
  bids: { orderBy: { amount: "desc" as const }, take: 30, include: { user: { select: { name: true, email: true } } } },
  _count: { select: { bids: true } },
};
type Row = NonNullable<Awaited<ReturnType<typeof loadRow>>>;
const loadRow = (id: string) => db.auction.findUnique({ where: { id }, include });

export function phaseOf(a: { status: string; startsAt: Date; endsAt: Date }, now = Date.now()): AuctionPhase {
  if (a.status === "CANCELLED") return "CANCELLED";
  if (now < a.startsAt.getTime()) return "UPCOMING";
  if (now < a.endsAt.getTime()) return "LIVE";
  return "ENDED";
}

export function maskName(name?: string | null, email?: string | null) {
  const base = (name || email?.split("@")[0] || "Bidder").trim();
  const [first, last] = base.split(/\s+/);
  const f = first.length <= 2 ? first : `${first[0]}${"•".repeat(Math.min(4, first.length - 2))}${first.at(-1)}`;
  return last ? `${f} ${last[0]}.` : f;
}

export function toAuctionView(a: Row): AuctionView {
  const top = a.bids[0];
  const current = top?.amount ?? null;
  return {
    id: a.id,
    title: a.title,
    phase: phaseOf(a),
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    startingBid: a.startingBid,
    bidIncrement: a.bidIncrement,
    hasReserve: a.reservePrice != null,
    reserveMet: a.reservePrice == null || (current ?? 0) >= a.reservePrice,
    currentBid: current,
    nextMinBid: current == null ? a.startingBid : current + a.bidIncrement,
    bidCount: a._count.bids,
    bids: a.bids.map((b) => ({ id: b.id, amount: b.amount, bidder: maskName(b.user.name, b.user.email), userId: b.userId, at: b.createdAt.toISOString() })),
    car: {
      slug: a.car.slug,
      model: a.car.model,
      year: a.car.year,
      brand: a.car.brand.name,
      brandSlug: a.car.brand.slug,
      heroImage: a.car.heroImage,
      heroCredit: a.car.heroCredit,
      sketchfabUid: a.car.sketchfabUid,
      sketchfabCredit: a.car.sketchfabCredit,
      specs: {
        engine: a.car.engine,
        powerHp: a.car.powerHp,
        torqueNm: a.car.torqueNm,
        zeroToHundred: a.car.zeroToHundred,
        topSpeedKmh: a.car.topSpeedKmh,
        drivetrain: a.car.drivetrain,
        transmission: a.car.transmission,
        seats: a.car.seats,
        weightKg: a.car.weightKg,
      },
    },
  };
}

/** Records the winner once an auction has ended. Idempotent. */
async function settle(a: Row) {
  if (phaseOf(a) !== "ENDED" || a.status === "SETTLED" || a.status === "ENDED") return;
  const top = a.bids[0];
  const won = top && (a.reservePrice == null || top.amount >= a.reservePrice);
  await db.auction.update({ where: { id: a.id }, data: { status: won ? "SETTLED" : "ENDED", winnerBidId: won ? top.id : null } });
  if (won) {
    await db.notification.create({ data: { userId: top.userId, type: "SYSTEM", title: "You won the auction", body: `${a.title} — winning bid $${top.amount.toLocaleString()}. Your advisor will be in touch.`, href: `/auctions/${a.id}` } });
  }
  mirror("Auctions", { id: a.id, title: a.title, status: won ? "SETTLED" : "ENDED", winningBid: top?.amount ?? "", winner: top?.user.email ?? "" }, "id");
}

export async function getAuction(id: string) {
  const row = await loadRow(id);
  if (!row) return null;
  await settle(row);
  return toAuctionView(row);
}

export async function getAuctions() {
  const rows = await db.auction.findMany({ include, orderBy: { startsAt: "asc" } });
  await Promise.all(rows.map(settle));
  return rows.map(toAuctionView);
}

export class BidError extends Error {}

export async function placeBid(auctionId: string, userId: string, amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) throw new BidError("Enter a whole-dollar amount.");
  const result = await db.$transaction(async (tx) => {
    const a = await tx.auction.findUnique({ where: { id: auctionId }, include: { bids: { orderBy: { amount: "desc" }, take: 1 } } });
    if (!a) throw new BidError("Auction not found.");
    const now = Date.now();
    const phase = phaseOf(a, now);
    if (phase === "UPCOMING") throw new BidError("Bidding hasn't opened yet.");
    if (phase !== "LIVE") throw new BidError("This auction has closed.");
    const top = a.bids[0];
    const min = top ? top.amount + a.bidIncrement : a.startingBid;
    if (amount < min) throw new BidError(`The minimum bid is now $${min.toLocaleString()}.`);
    if (top && amount > top.amount * 3) throw new BidError("That bid looks like a typo — it's more than 3× the current bid.");
    if (top?.userId === userId) throw new BidError("You're already the highest bidder.");

    const bid = await tx.bid.create({ data: { auctionId, userId, amount } });
    let extended = false;
    if (a.endsAt.getTime() - now < a.antiSnipeSecs * 1000) {
      await tx.auction.update({ where: { id: auctionId }, data: { endsAt: new Date(now + a.antiSnipeSecs * 1000), status: "LIVE" } });
      extended = true;
    } else if (a.status !== "LIVE") {
      await tx.auction.update({ where: { id: auctionId }, data: { status: "LIVE" } });
    }
    if (top && top.userId !== userId) {
      await tx.notification.create({ data: { userId: top.userId, type: "OUTBID", title: "You've been outbid", body: `${a.title}: new high bid $${amount.toLocaleString()}.`, href: `/auctions/${auctionId}` } });
    }
    return { bid, extended, title: a.title };
  });

  const view = await getAuction(auctionId);
  const bidder = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  bus.emit(`auction:${auctionId}`, { type: "update", view, extended: result.extended, bidId: result.bid.id });
  mirror("Bids", { id: result.bid.id, time: result.bid.createdAt, auctionId, auction: result.title, bidder: bidder?.email, amount });
  return { view, extended: result.extended };
}

/** Admin changes (create/edit/cancel) push a fresh view to anyone watching. */
export async function broadcast(auctionId: string) {
  const view = await getAuction(auctionId);
  if (view) bus.emit(`auction:${auctionId}`, { type: "update", view });
}
