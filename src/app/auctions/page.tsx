import type { Metadata } from "next";
import Link from "next/link";
import { getAuctions } from "@/lib/auctions";
import { currentUser } from "@/lib/session";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Live Auctions" };
export const dynamic = "force-dynamic";

const TYPES = [
  { key: "all", label: "All sales", blurb: "Every lot in the room" },
  { key: "HOUSE", label: "AUREL House", blurb: "Curated by our specialists" },
  { key: "DEALER", label: "Dealers · First-hand", blurb: "New and delivery-mileage cars, straight from dealers" },
  { key: "COLLECTOR", label: "Collectors · Pre-owned", blurb: "Second-hand cars from private collections" },
] as const;

export default async function AuctionsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sp = await searchParams;
  const type = TYPES.some((t) => t.key === sp.type) ? sp.type! : "all";
  const [all, user] = await Promise.all([getAuctions(), currentUser()]);
  const list = type === "all" ? all : all.filter((a) => a.listingType === type);
  const live = list.filter((a) => a.phase === "LIVE");
  const upcoming = list.filter((a) => a.phase === "UPCOMING");
  const ended = list.filter((a) => a.phase === "ENDED").reverse();
  const count = (k: string) => (k === "all" ? all : all.filter((a) => a.listingType === k)).filter((a) => a.phase === "LIVE" || a.phase === "UPCOMING").length;

  const section = (title: string, eyebrow: string, items: typeof all, empty: string) => (
    <section className="mt-16">
      <div className="flex items-end justify-between border-b border-white/[0.07] pb-5">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">{title}</h2>
        </div>
        <p className="text-xs text-mist">{items.length}</p>
      </div>
      {items.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.05}>
              <AuctionCard auction={a} />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-mist">{empty}</p>
      )}
    </section>
  );

  return (
    <div className="mx-auto max-w-[1480px] px-5 pb-28 pt-32 md:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {all.filter((a) => a.phase === "LIVE").length} live now
          </p>
          <h1 className="mt-4 font-display text-6xl leading-none md:text-8xl">
            The auction <span className="text-gilded">room</span>
          </h1>
          <p className="mt-5 max-w-xl text-mist">Verified members bid in real time. Every bid in the final two minutes extends the clock, so the hammer falls fairly.</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <Link href={user ? "/auctions/sell" : "/login?next=/auctions/sell"} className="btn btn-primary">Sell your car at auction</Link>
          <p className="text-xs text-mist">Dealers and collectors welcome</p>
        </div>
      </div>

      <nav className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/auctions" : `/auctions?type=${t.key}`}
            className={`border p-4 transition ${type === t.key ? "border-gold bg-gold/[0.07]" : "border-white/10 hover:border-white/30"}`}
            style={{ borderRadius: "var(--radius)" }}
          >
            <p className="flex items-center justify-between text-sm">
              {t.label}
              <span className={`text-[10px] ${type === t.key ? "text-gold" : "text-mist"}`}>{count(t.key)} open</span>
            </p>
            <p className="mt-1 text-xs text-mist">{t.blurb}</p>
          </Link>
        ))}
      </nav>

      {section("Live now", "Bidding open", live, "No lots of this kind are live right now.")}
      {section("Upcoming", "Preview & register", upcoming, "Nothing scheduled yet — new lots are announced to the private client list first.")}
      {section("Results", "Hammer prices", ended, "No completed sales yet.")}
    </div>
  );
}
