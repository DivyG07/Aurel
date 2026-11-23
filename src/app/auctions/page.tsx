import type { Metadata } from "next";
import { getAuctions } from "@/lib/auctions";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Live Auctions" };
export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const all = await getAuctions();
  const live = all.filter((a) => a.phase === "LIVE");
  const upcoming = all.filter((a) => a.phase === "UPCOMING");
  const ended = all.filter((a) => a.phase === "ENDED").reverse();

  const section = (title: string, eyebrow: string, list: typeof all, empty: string) => (
    <section className="mt-20">
      <div className="flex items-end justify-between border-b border-white/[0.07] pb-5">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">{title}</h2>
        </div>
        <p className="text-xs text-mist">{list.length}</p>
      </div>
      {list.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a, i) => (
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
    <div className="mx-auto max-w-[1480px] px-5 pb-28 pt-36 md:px-10">
      <p className="eyebrow flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {live.length} live now
      </p>
      <h1 className="mt-4 font-display text-6xl leading-none md:text-8xl">
        The auction <span className="italic text-gilded">room</span>
      </h1>
      <p className="mt-5 max-w-xl text-mist">Verified members bid in real time. Every bid in the final two minutes extends the clock, so the hammer falls fairly.</p>
      {section("Live now", "Bidding open", live, "No lots are live right now. Check the upcoming sales.")}
      {section("Upcoming", "Preview & register", upcoming, "New lots are announced to the private client list first.")}
      {section("Results", "Hammer prices", ended, "No completed sales yet.")}
    </div>
  );
}
