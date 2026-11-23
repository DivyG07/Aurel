import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { getMyListings, phaseOf } from "@/lib/auctions";
import { parseList } from "@/lib/prefs";
import { PreferencesForm } from "@/components/account/PreferencesForm";
import { DeleteAccount, MyListings, ProfileForm } from "./AccountClient";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

const nav = [
  ["profile", "Profile"],
  ["preferences", "Preferences"],
  ["garage", "My garage"],
  ["listings", "My listings"],
  ["bids", "My bids"],
  ["posts", "My posts"],
  ["notifications", "Notifications"],
  ["danger", "Delete account"],
];

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ listed?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/account");
  const [me, bids, notes, listings, posts, brands] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, image: true, bio: true, phone: true, country: true, role: true, createdAt: true, loginCount: true, favoriteBrands: true, budget: true, interests: true, carsOwned: true } }),
    db.bid.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { auction: { include: { car: { include: { brand: true } }, bids: { orderBy: { amount: "desc" }, take: 1 } } } } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    getMyListings(user.id),
    db.forumPost.findMany({ where: { authorId: user.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, title: true, score: true, commentCount: true, createdAt: true, flair: true } }),
    db.brand.findMany({ select: { slug: true, name: true, accentHex: true }, orderBy: { name: "asc" } }),
  ]);
  const garageCount = await db.garageCar.count({ where: { userId: user.id } });
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });

  const byAuction = new Map<string, (typeof bids)[number]>();
  for (const b of bids) if (!byAuction.has(b.auctionId) || byAuction.get(b.auctionId)!.amount < b.amount) byAuction.set(b.auctionId, b);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-28 pt-32 md:px-10">
      <p className="eyebrow">{isAdmin ? "Staff" : me?.role === "DEALER" ? "Dealer" : "Collector"} · member since {me?.createdAt.getFullYear()}</p>
      <h1 className="mt-4 font-display text-5xl leading-none md:text-6xl">{me?.name ?? me?.email}</h1>
      <p className="mt-3 text-sm text-mist">{me?.email} · {me?.loginCount ?? 0} sign-ins</p>
      {sp.listed && <p className="mt-6 border border-gold/30 bg-gold/5 p-4 text-sm text-gold">Your car has been submitted. Our team reviews every listing — you&apos;ll get a notification when it&apos;s approved.</p>}

      <div className="mt-12 grid gap-12 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:self-start">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="whitespace-nowrap border-l-2 border-transparent px-3 py-2 text-sm text-mist transition hover:border-gold hover:text-ivory">{label}</a>
          ))}
        </nav>

        <div className="space-y-20">
          <section id="profile" className="scroll-mt-28">
            <p className="eyebrow mb-6">Profile</p>
            <ProfileForm initial={{ name: me?.name ?? "", bio: me?.bio ?? "", phone: me?.phone ?? "", country: me?.country ?? "", image: me?.image ?? null }} />
          </section>

          <section id="preferences" className="scroll-mt-28">
            <p className="eyebrow mb-6">Preferences</p>
            <PreferencesForm
              brands={brands}
              isAdmin={isAdmin}
              initial={{ accountType: me?.role === "DEALER" ? "DEALER" : "COLLECTOR", brands: parseList(me?.favoriteBrands), budget: me?.budget ?? "", interests: parseList(me?.interests), carsOwned: me?.carsOwned ?? "" }}
            />
          </section>

          <section id="garage" className="scroll-mt-28">
            <div className="mb-6 flex items-center justify-between">
              <p className="eyebrow">My garage</p>
              <Link href="/garage" className="btn btn-ghost !px-4 !py-2">Manage garage →</Link>
            </div>
            <p className="text-sm text-mist">{garageCount ? `${garageCount} ${garageCount === 1 ? "car" : "cars"} in your collection.` : "Add the cars you own — pick from our catalogue or enter any car."}</p>
          </section>

          <section id="listings" className="scroll-mt-28">
            <div className="mb-6 flex items-center justify-between">
              <p className="eyebrow">My auction listings</p>
              <Link href="/auctions/sell" className="btn btn-ghost !px-4 !py-2">+ List a car</Link>
            </div>
            <MyListings listings={listings.map((l) => ({ id: l.id, title: l.title, status: l.status, phase: l.phase, reviewNote: l.reviewNote, listingType: l.listingType, image: l.car.heroImage, startsAt: l.startsAt, endsAt: l.endsAt, bidCount: l.bidCount, currentBid: l.currentBid, startingBid: l.startingBid }))} />
          </section>

          <section id="bids" className="scroll-mt-28">
            <p className="eyebrow mb-6">My bids</p>
            <div className="space-y-3">
              {[...byAuction.values()].map((b) => {
                const a = b.auction;
                const phase = phaseOf(a);
                const top = a.bids[0];
                const leading = top?.userId === user.id;
                const status = phase === "LIVE" ? (leading ? "Leading" : "Outbid") : phase === "ENDED" ? (a.winnerBidId && leading ? "Won" : "Closed") : phase === "CANCELLED" ? "Cancelled" : "Upcoming";
                return (
                  <Link key={a.id} href={`/auctions/${a.id}`} className="flex items-center justify-between gap-4 border border-white/[0.07] bg-onyx p-5 transition hover:border-gold/40">
                    <div>
                      <p className="text-xs text-gold">{a.car?.brand.name ?? a.make}</p>
                      <p className="font-display text-xl">{a.title}</p>
                      <p className="mt-1 text-xs text-mist">My best {formatPrice(b.amount)} · high {top ? formatPrice(top.amount) : "—"}</p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${status === "Leading" || status === "Won" ? "text-emerald-300" : status === "Outbid" ? "text-red-300" : "text-mist"}`}>{status}</span>
                  </Link>
                );
              })}
              {!byAuction.size && <p className="text-sm text-mist">No bids yet. <Link href="/auctions" className="text-gold">See what&apos;s live →</Link></p>}
            </div>
          </section>

          <section id="posts" className="scroll-mt-28">
            <div className="mb-6 flex items-center justify-between">
              <p className="eyebrow">My forum posts</p>
              <Link href="/forum/new" className="btn btn-ghost !px-4 !py-2">+ New post</Link>
            </div>
            <ul className="space-y-2">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/forum/${p.id}`} className="flex items-center justify-between gap-4 border border-white/[0.07] bg-onyx px-5 py-4 transition hover:border-gold/40">
                    <span className="truncate">{p.title}</span>
                    <span className="shrink-0 text-xs text-mist">▲ {p.score} · 💬 {p.commentCount}</span>
                  </Link>
                </li>
              ))}
              {!posts.length && <li className="text-sm text-mist">You haven&apos;t posted yet. <Link href="/forum" className="text-gold">Visit the Paddock →</Link></li>}
            </ul>
          </section>

          <section id="notifications" className="scroll-mt-28">
            <p className="eyebrow mb-6">Notifications</p>
            <ul className="space-y-2">
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

          <section id="danger" className="scroll-mt-28">
            <p className="eyebrow mb-6 !text-red-300">Delete account</p>
            {isAdmin ? <p className="text-sm text-mist">Admin accounts can&apos;t be deleted from here.</p> : <DeleteAccount email={me?.email ?? ""} />}
          </section>
        </div>
      </div>
    </div>
  );
}
