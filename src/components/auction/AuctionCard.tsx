"use client";

import Link from "next/link";
import Image from "next/image";
import { listingTypeLabel, type AuctionView } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Countdown } from "@/components/ui/Countdown";

export function PhaseBadge({ phase }: { phase: AuctionView["phase"] }) {
  const map = {
    LIVE: { label: "Live", cls: "bg-red-500 text-white" },
    UPCOMING: { label: "Upcoming", cls: "bg-gold text-ink" },
    ENDED: { label: "Closed", cls: "bg-white/15 text-ivory" },
    CANCELLED: { label: "Cancelled", cls: "bg-white/10 text-mist" },
    PENDING: { label: "In review", cls: "bg-sky-400/20 text-sky-200" },
    REJECTED: { label: "Not approved", cls: "bg-red-400/15 text-red-200" },
  }[phase];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.25em] ${map.cls}`}>
      {phase === "LIVE" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {map.label}
    </span>
  );
}

export function ListingTypeBadge({ type }: { type: AuctionView["listingType"] }) {
  const cls = type === "DEALER" ? "border-sky-300/50 text-sky-200" : type === "COLLECTOR" ? "border-emerald-300/50 text-emerald-200" : "border-gold/60 text-gold";
  return <span className={`inline-flex items-center border bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur ${cls}`}>{listingTypeLabel[type]}</span>;
}

export function AuctionCard({ auction: a }: { auction: AuctionView }) {
  return (
    <Link href={`/auctions/${a.id}`} className="group block overflow-hidden border border-white/[0.07] bg-onyx transition hover:border-gold/50" style={{ borderRadius: "var(--radius)" }}>
      <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
        {!a.car.heroImage && <div className="absolute inset-0 grid place-items-center font-display text-3xl text-white/15">{a.car.brand}</div>}
        {a.car.heroImage && <Image src={a.car.heroImage} alt={a.car.model} fill sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw" className="object-cover transition duration-1000 ease-lux group-hover:scale-105" />}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2"><PhaseBadge phase={a.phase} /><ListingTypeBadge type={a.listingType} /></div>
        <div className="absolute bottom-4 right-4 rounded-sm bg-black/60 px-3 py-1.5 text-xs backdrop-blur">
          {a.phase === "LIVE" && <>Ends in <Countdown to={a.endsAt} size="sm" /></>}
          {a.phase === "UPCOMING" && <>Opens in <Countdown to={a.startsAt} size="sm" /></>}
          {a.phase === "ENDED" && new Date(a.endsAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          {a.phase === "CANCELLED" && "Withdrawn"}
        </div>
      </div>
      <div className="p-6">
        <p className="eyebrow">{a.car.brand}</p>
        <h3 className="mt-2 line-clamp-2 font-display text-2xl leading-tight">{a.title}</h3>
        <div className="mt-5 flex items-end justify-between border-t border-white/[0.07] pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-mist">{a.phase === "ENDED" ? (a.currentBid && a.reserveMet ? "Sold for" : "High bid") : a.currentBid ? "Current bid" : "Starting bid"}</p>
            <p className="mt-1 font-display text-3xl text-gilded">{formatPrice(a.currentBid ?? a.startingBid)}</p>
          </div>
          <p className="text-xs text-mist">
            {a.bidCount} {a.bidCount === 1 ? "bid" : "bids"}
            {a.hasReserve && <span className={`ml-2 ${a.reserveMet ? "text-emerald-300" : ""}`}>· {a.reserveMet ? "Reserve met" : "Reserve not met"}</span>}
          </p>
        </div>
      </div>
    </Link>
  );
}
