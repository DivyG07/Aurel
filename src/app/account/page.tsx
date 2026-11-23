import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { phaseOf } from "@/lib/auctions";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [me, bids, notes] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { createdAt: true, loginCount: true } }),
    db.bid.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { auction: { include: { car: { include: { brand: true } }, bids: { orderBy: { amount: "desc" }, take: 1 } } } } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });

  // One row per auction with my best bid.
  const byAuction = new Map<string, (typeof bids)[number]>();
  for (const b of bids) if (!byAuction.has(b.auctionId) || byAuction.get(b.auctionId)!.amount < b.amount) byAuction.set(b.auctionId, b);

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-28 pt-36 md:px-10">
      <p className="eyebrow">Member since {me?.createdAt.getFullYear()}</p>
      <h1 className="mt-4 font-display text-6xl leading-none">{user.name ?? user.email}</h1>
      <p className="mt-3 text-sm text-mist">{user.email} · {me?.loginCount ?? 0} sign-ins</p>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <p className="eyebrow">My bids</p>
          <div className="mt-6 space-y-3">
            {[...byAuction.values()].map((b) => {
              const a = b.auction;
              const phase = phaseOf(a);
              const top = a.bids[0];
              const leading = top?.userId === user.id;
              const status = phase === "LIVE" ? (leading ? "Leading" : "Outbid") : phase === "ENDED" ? (a.winnerBidId && leading ? "Won" : "Closed") : phase === "CANCELLED" ? "Cancelled" : "Upcoming";
              return (
                <Link key={a.id} href={`/auctions/${a.id}`} className="flex items-center justify-between gap-4 border border-white/[0.07] bg-onyx p-5 transition hover:border-gold/40">
                  <div>
                    <p className="text-xs text-gold">{a.car.brand.name}</p>
                    <p className="font-display text-xl">{a.title}</p>
                    <p className="mt-1 text-xs text-mist">My best {formatPrice(b.amount)} · high {top ? formatPrice(top.amount) : "—"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${status === "Leading" || status === "Won" ? "text-emerald-300" : status === "Outbid" ? "text-red-300" : "text-mist"}`}>{status}</span>
                </Link>
              );
            })}
            {!byAuction.size && (
              <p className="text-sm text-mist">No bids yet. <Link href="/auctions" className="text-gold">See what&apos;s live →</Link></p>
            )}
          </div>
        </section>
        <section>
          <p className="eyebrow">Notifications</p>
          <ul className="mt-6 space-y-2">
            {notes.map((n) => (
              <li key={n.id} className={`border-l-2 bg-onyx p-4 ${n.readAt ? "border-white/10" : "border-gold"}`}>
                <p className="text-sm">{n.title}</p>
                <p className="mt-1 text-xs text-mist">{n.body}</p>
                {n.href && <Link href={n.href} className="mt-2 inline-block text-[10px] uppercase tracking-[0.2em] text-gold">Open →</Link>}
              </li>
            ))}
            {!notes.length && <li className="text-sm text-mist">You&apos;re all caught up.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
