"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AuctionView } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { bid } from "@/app/auctions/actions";
import { toast } from "@/lib/stores";
import { Countdown, useNow } from "@/components/ui/Countdown";
import { Counter } from "@/components/ui/Counter";
import { Viewer360 } from "@/components/car/Viewer360";
import { ListingTypeBadge, PhaseBadge } from "./AuctionCard";
import { RazorpayButton } from "@/components/payments/RazorpayButton";
import { conditionLabel } from "@/lib/types";

const POLL_ONLY = process.env.NEXT_PUBLIC_REALTIME === "poll";

/** Live bidding room: SSE-driven price, bid feed, watcher count and anti-snipe clock. */
export function AuctionRoom({ initial, userId, needsDeposit = false }: { initial: AuctionView; userId: string | null; needsDeposit?: boolean }) {
  const [a, setA] = useState(initial);
  const [offset, setOffset] = useState(0);
  const [watching, setWatching] = useState(1);
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<"photo" | "360">("photo");
  const [photo, setPhoto] = useState(0);
  const [amount, setAmount] = useState(initial.nextMinBid);
  const [pending, start] = useTransition();
  const [flash, setFlash] = useState(0);
  const pathname = usePathname();
  const lastTop = useRef(initial.bids[0]?.id);
  const touched = useRef(false);

  // Live updates over Server-Sent Events, with a polling fallback.
  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const apply = (payload: { view: AuctionView; serverNow?: number; extended?: boolean }) => {
      if (payload.serverNow) setOffset(payload.serverNow - Date.now());
      const v = payload.view;
      setA(v);
      const top = v.bids[0];
      if (top && top.id !== lastTop.current) {
        lastTop.current = top.id;
        setFlash((f) => f + 1);
        if (top.userId !== userId) {
          toast(`New bid ${formatPrice(top.amount)} by ${top.bidder}`, "info");
          if (userId && v.bids.some((b) => b.userId === userId)) toast("You've been outbid", "error");
        }
        if (payload.extended) toast("Late bid — the clock was extended", "info");
      }
      if (!touched.current || top?.userId !== userId) setAmount(v.nextMinBid);
    };
    const connect = () => {
      es = new EventSource(`/api/auctions/${initial.id}/stream`);
      es.addEventListener("open", () => setConnected(true));
      es.addEventListener("update", (e) => apply(JSON.parse((e as MessageEvent).data)));
      es.addEventListener("presence", (e) => setWatching(JSON.parse((e as MessageEvent).data).count));
      es.addEventListener("error", () => {
        setConnected(false);
        if (!poll) poll = setInterval(() => fetch(`/api/auctions/${initial.id}`).then((r) => r.json()).then((d) => apply(d)).catch(() => {}), 5000);
      });
    };
    // Serverless hosts (Netlify) can't hold a shared in-memory event bus, so poll there instead.
    if (POLL_ONLY) {
      const tick = () => fetch(`/api/auctions/${initial.id}`, { cache: "no-store" }).then((r) => r.json()).then((d) => { setConnected(true); apply(d); }).catch(() => setConnected(false));
      tick();
      poll = setInterval(tick, 2500);
    } else connect();
    return () => {
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [initial.id, userId]);

  // Phase is derived on the client from the server-corrected clock, so the room flips
  // from upcoming → live → closed exactly on time without waiting for an event.
  const now = useNow(offset);
  const phase: AuctionView["phase"] = a.phase === "CANCELLED" || !now ? a.phase : now < Date.parse(a.startsAt) ? "UPCOMING" : now < Date.parse(a.endsAt) ? "LIVE" : "ENDED";
  const leading = !!userId && a.bids[0]?.userId === userId;
  const live = phase === "LIVE";

  function submit(value: number) {
    start(async () => {
      const r = await bid(a.id, value);
      toast(r.message, r.ok ? "success" : "error");
      touched.current = false;
    });
  }

  return (
    <div className="mx-auto max-w-[1480px] px-5 pb-24 pt-28 md:px-10">
      <Link href="/auctions" className="text-[11px] uppercase tracking-[0.25em] text-mist hover:text-gold">← All auctions</Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden border border-white/[0.07] bg-graphite" style={{ borderRadius: "var(--radius)" }} data-lenis-prevent>
            {view === "360" && a.car.sketchfabUid ? (
              <Viewer360 uid={a.car.sketchfabUid} title={a.car.model} credit={a.car.sketchfabCredit} />
            ) : (
              (a.images[photo] ?? a.car.heroImage) && <Image key={a.images[photo] ?? a.car.heroImage} src={(a.images[photo] ?? a.car.heroImage)!} alt={a.car.model} fill priority sizes="60vw" className="object-cover" />
            )}
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <PhaseBadge phase={phase} />
              <span className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[10px] backdrop-blur">
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-white/40"}`} />
                {POLL_ONLY ? "Live" : `${watching} watching`}
              </span>
            </div>
            {a.car.sketchfabUid && (
              <div className="absolute bottom-4 left-4 flex overflow-hidden border border-white/15 bg-black/60 backdrop-blur" style={{ borderRadius: "var(--radius)" }}>
                {(["photo", "360"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] ${view === v ? "bg-gold text-ink" : "text-ivory/80"}`}>
                    {v === "photo" ? "Photo" : "360° view"}
                  </button>
                ))}
              </div>
            )}
          </div>
          {view === "photo" && a.car.heroCredit && <p className="mt-2 text-[10px] text-mist">Photo: {a.car.heroCredit}</p>}

          {a.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto" data-lenis-prevent>
              {a.images.map((src, n) => (
                <button key={src} onClick={() => { setView("photo"); setPhoto(n); }} className={`relative h-16 w-24 shrink-0 overflow-hidden border ${photo === n ? "border-gold" : "border-white/15 opacity-70 hover:opacity-100"}`}>
                  <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <ListingTypeBadge type={a.listingType} />
            {a.seller && <span className="text-xs text-mist">Listed by {a.seller.name}</span>}
          </div>
          <p className="eyebrow mt-4">{a.car.brand}{a.car.year ? ` · ${a.car.year}` : ""}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">{a.title}</h1>
          <div className="mt-8 grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
            {(a.car.specs
              ? [
                  ["Power", `${a.car.specs.powerHp} hp`],
                  ["0–100", `${a.car.specs.zeroToHundred}s`],
                  ["Top speed", `${a.car.specs.topSpeedKmh} km/h`],
                  ["Drivetrain", a.car.specs.drivetrain],
                ]
              : [
                  ["Year", a.car.year ? String(a.car.year) : "—"],
                  ["Mileage", a.details.mileageKm != null ? `${a.details.mileageKm.toLocaleString()} km` : "—"],
                  ["Condition", a.details.condition ? (conditionLabel[a.details.condition] ?? a.details.condition) : "—"],
                  ["Location", a.details.location ?? "—"],
                ]
            ).map(([k, v]) => (
              <div key={k} className="bg-ink p-5">
                <p className="text-[9px] uppercase tracking-[0.25em] text-mist">{k}</p>
                <p className="mt-1 text-lg">{v}</p>
              </div>
            ))}
          </div>
          {a.details.description && (
            <div className="mt-8">
              <p className="eyebrow">From the seller</p>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ivory/85">{a.details.description}</p>
            </div>
          )}
          {a.car.slug && <Link href={`/cars/${a.car.slug}`} className="btn btn-ghost mt-6">Full specification →</Link>}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-white/[0.07] bg-onyx p-6 md:p-8" style={{ borderRadius: "var(--radius)" }}>
            <p className="text-[10px] uppercase tracking-[0.25em] text-mist">
              {phase === "UPCOMING" ? "Bidding opens in" : phase === "LIVE" ? "Time remaining" : "Auction closed"}
            </p>
            <div className="mt-3">
              {phase === "UPCOMING" && <Countdown to={a.startsAt} offsetMs={offset} />}
              {phase === "LIVE" && <Countdown to={a.endsAt} offsetMs={offset} />}
              {phase === "ENDED" && <p className="font-display text-3xl">{new Date(a.endsAt).toLocaleString()}</p>}
              {phase === "CANCELLED" && <p className="font-display text-3xl">Withdrawn by the house</p>}
            </div>

            <motion.div key={flash} initial={{ backgroundColor: "rgba(201,169,110,0.25)" }} animate={{ backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 1.4 }} className="-mx-3 mt-8 rounded px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-mist">{a.currentBid ? (phase === "ENDED" ? "Final bid" : "Current bid") : "Starting bid"}</p>
              <p className="mt-1 font-display text-6xl text-gilded">
                <Counter value={a.currentBid ?? a.startingBid} format={(n) => formatPrice(Math.round(n))} />
              </p>
              <p className="mt-2 text-xs text-mist">
                {a.bidCount} {a.bidCount === 1 ? "bid" : "bids"} · increment {formatPrice(a.bidIncrement)}
                {a.hasReserve && <span className={a.reserveMet ? "text-emerald-300" : "text-gold"}> · {a.reserveMet ? "Reserve met" : "Reserve not yet met"}</span>}
              </p>
            </motion.div>

            {leading && live && <p className="mt-4 border border-emerald-400/30 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-300">You are the highest bidder.</p>}
            {phase === "ENDED" && a.bids[0] && a.reserveMet && (
              <p className="mt-4 border border-gold/30 bg-gold/5 px-3 py-2 text-sm text-gold">
                {a.bids[0].userId === userId ? "Congratulations — you won this lot." : `Sold to ${a.bids[0].bidder}.`}
              </p>
            )}

            {userId && a.seller?.id === userId && (
              <p className="mt-6 border border-white/10 px-3 py-3 text-sm text-mist">This is your listing — you can watch bids come in, but you can&apos;t bid on it.</p>
            )}
            {needsDeposit && (phase === "LIVE" || phase === "UPCOMING") && a.seller?.id !== userId && (
              <div className="mt-6 border border-gold/40 bg-gold/[0.06] p-4">
                <p className="text-sm text-ivory">Become a verified bidder</p>
                <p className="mt-1 text-xs leading-relaxed text-mist">A one-time refundable deposit of ₹5,000 unlocks bidding in every auction. Refunded on request if you don&apos;t win.</p>
                <RazorpayButton purpose="BIDDER_DEPOSIT" label="Pay ₹5,000 deposit & bid" className="btn btn-primary mt-4 w-full !whitespace-normal" />
              </div>
            )}
            {live && a.seller?.id !== userId && !needsDeposit && (
              userId ? (
                <div className="mt-6 space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 5].map((m) => {
                      const v = (a.currentBid ?? a.startingBid - a.bidIncrement) + a.bidIncrement * m;
                      return (
                        <button key={m} onClick={() => { touched.current = true; setAmount(v); }} className={`flex-1 border py-2 text-xs transition ${amount === v ? "border-gold text-gold" : "border-white/15 hover:border-white/40"}`}>
                          {formatPrice(v, { compact: true })}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center border border-white/15 focus-within:border-gold" style={{ borderRadius: "var(--radius)" }}>
                    <span className="pl-4 text-mist">$</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={a.nextMinBid}
                      step={a.bidIncrement}
                      value={amount}
                      onChange={(e) => { touched.current = true; setAmount(Number(e.target.value)); }}
                      className="w-full bg-transparent px-2 py-4 text-lg outline-none"
                    />
                  </div>
                  <button onClick={() => submit(amount)} disabled={pending || amount < a.nextMinBid || leading} className="btn btn-primary w-full !py-5">
                    {pending ? "Placing bid…" : leading ? "You're leading" : `Place bid · ${formatPrice(amount)}`}
                  </button>
                  <p className="text-center text-[11px] text-mist">Minimum next bid {formatPrice(a.nextMinBid)}. Bids are binding.</p>
                </div>
              ) : (
                <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-primary mt-6 w-full !py-5">Sign in to bid</Link>
              )
            )}
            {phase === "UPCOMING" && !userId && <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-ghost mt-6 w-full">Sign in to be ready</Link>}
          </div>

          <div className="mt-5 border border-white/[0.07] bg-onyx p-6" style={{ borderRadius: "var(--radius)" }}>
            <p className="eyebrow">Bid history</p>
            <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto" data-lenis-prevent>
              <AnimatePresence initial={false}>
                {a.bids.map((b, i) => (
                  <motion.li
                    key={b.id}
                    layout
                    initial={{ opacity: 0, x: -20, backgroundColor: "rgba(201,169,110,0.2)" }}
                    animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 0.8 }}
                    className={`flex items-center justify-between px-2 py-2.5 text-sm ${i === 0 ? "text-ivory" : "text-ivory/60"}`}
                  >
                    <span>
                      {b.bidder}
                      {b.userId === userId && <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-gold">You</span>}
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="text-[11px] text-mist">{new Date(b.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                      <span className="font-medium tabular-nums">{formatPrice(b.amount)}</span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {!a.bids.length && <li className="py-4 text-sm text-mist">No bids yet — be the first.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
