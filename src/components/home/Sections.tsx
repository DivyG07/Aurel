"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { motion } from "motion/react";
import { subscribe } from "@/app/actions";
import { Counter } from "@/components/ui/Counter";
import { Countdown } from "@/components/ui/Countdown";
import { Reveal, SplitHeading } from "@/components/ui/Reveal";
import { formatPrice } from "@/lib/format";
import type { AuctionView } from "@/lib/types";
import { useBrandWorld } from "@/components/site/useBrandWorld";
import { BrandMark } from "@/components/site/BrandMark";

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/5 py-8">
      <div className="flex w-max animate-marquee items-center gap-14 whitespace-nowrap hover:[animation-play-state:paused]">
        {row.map((name, i) => (
          <span key={i} className="flex items-center gap-14 font-display text-4xl text-ivory/70 md:text-6xl">
            {name}
            <span className="text-base text-gold">✦</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}

export function LiveAuctionStrip({ auction }: { auction: AuctionView }) {
  return (
    <Link href={`/auctions/${auction.id}`} className="group relative mx-auto my-20 block max-w-[1480px] overflow-hidden px-5 md:px-10">
      <div className="relative grid overflow-hidden border border-white/10 md:grid-cols-[1.2fr_1fr]" style={{ borderRadius: "var(--radius)" }}>
        <div className="relative aspect-[16/9] md:aspect-auto">
          {auction.car.heroImage && <Image src={auction.car.heroImage} alt="" fill sizes="60vw" className="object-cover object-[50%_58%]" />}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-onyx" />
        </div>
        <div className="bg-onyx p-8 md:p-12">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live auction
          </p>
          <h3 className="mt-4 font-display text-3xl leading-tight md:text-4xl">{auction.title}</h3>
          <div className="mt-8 flex flex-wrap items-end gap-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-mist">{auction.currentBid ? "Current bid" : "Starting bid"}</p>
              <p className="mt-1 font-display text-4xl text-gilded">{formatPrice(auction.currentBid ?? auction.startingBid)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-mist">Closes in</p>
              <p className="mt-1 font-display text-4xl"><Countdown to={auction.endsAt} size="sm" /></p>
            </div>
          </div>
          <span className="btn btn-primary mt-8">Join the room →</span>
        </div>
      </div>
    </Link>
  );
}

export function Stats({ cars, brands, value, live }: { cars: number; brands: number; value: number; live: number }) {
  const compact = (n: number) => formatPrice(n, { compact: true });
  const items = [
    { label: "Automobiles in residence", node: <Counter value={cars} /> },
    { label: "Marques represented", node: <Counter value={brands} /> },
    { label: "Collection value", node: <Counter value={value} format={compact} /> },
    { label: "Auctions live now", node: <Counter value={live} /> },
  ];
  return (
    <section className="mx-auto grid max-w-[1480px] grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
      {items.map((it, i) => (
        <Reveal key={it.label} delay={i * 0.08} className="bg-ink px-6 py-14 md:px-10">
          <p className="font-display text-5xl text-ivory md:text-6xl">{it.node}</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-mist">{it.label}</p>
        </Reveal>
      ))}
    </section>
  );
}

const experiences = [
  { title: "360° Studio", body: "Orbit real cars inside and out, and repaint them live.", href: "/cars" },
  { title: "Live Auctions", body: "Real-time bidding with anti-snipe protection.", href: "/auctions" },
  { title: "Brand Worlds", body: "Enter a marque and the whole showroom becomes theirs.", href: "/#marques" },
  { title: "Icons & Their Cars", body: "The publicly reported garages of legends.", href: "/icons" },
  { title: "Side-by-side Compare", body: "Up to three cars, every spec and colour aligned.", href: "/compare" },
  { title: "Private Viewings", body: "Book a viewing or test drive in two taps.", href: "/concierge" },
];

export function Experiences({ images }: { images: string[] }) {
  return (
    <section className="mx-auto max-w-[1480px] px-5 py-24 md:px-10">
      <p className="eyebrow">The AUREL experience</p>
      <h2 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] md:text-6xl">
        <SplitHeading text="A showroom without walls, open to the few." />
      </h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {experiences.map((e, i) => (
          <motion.div key={e.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <Link href={e.href} className="group flex h-full flex-col overflow-hidden border border-white/[0.07] bg-onyx transition hover:border-gold/50" style={{ borderRadius: "var(--radius)" }}>
              <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
                {images[i % Math.max(1, images.length)] && (
                  <Image src={images[i % images.length]} alt="" fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover object-[50%_58%] transition-opacity duration-700 group-hover:opacity-90" />
                )}
              </div>
              <div className="flex flex-1 items-start gap-4 p-6">
                <span className="mt-1 text-xs tabular-nums text-gold">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-2xl leading-tight md:text-3xl">{e.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{e.body}</p>
                  <span className="mt-4 inline-block text-[10px] uppercase tracking-[0.25em] text-gold">Open →</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
type MarqueRow = { slug: string; name: string; country: string; founded: number; accentHex: string; tagline: string | null; count: number; image: string | null };

/** Brand index. Clicking a row enters that brand world. */
export function Marques({ brands }: { brands: MarqueRow[] }) {
  const { enter } = useBrandWorld();

  return (
    <section id="marques" className="relative mx-auto max-w-[1480px] scroll-mt-24 px-5 py-28 md:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Marques</p>
          <h2 className="mt-4 font-display text-5xl md:text-7xl"><SplitHeading text="Choose a world" /></h2>
          <p className="mt-4 max-w-md text-sm text-mist">Each house has its own showroom. Step in and the whole site takes on its colours, type and mood.</p>
        </div>
      </div>
      <ul className="mt-14 border-t border-white/[0.07]">
        {brands.map((b, i) => (
          <Reveal key={b.slug} delay={i * 0.03} y={20}>
            <li>
              <button onClick={() => enter(b.slug, b.accentHex, b.name)} className="group relative grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-white/[0.07] py-7 text-left md:grid-cols-[80px_1.4fr_1fr_1fr_auto]">
                <span className="absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 transition-transform duration-700 ease-lux group-hover:scale-x-100" style={{ background: b.accentHex }} />
                <BrandMark slug={b.slug} name={b.name} color={b.accentHex} className="hidden h-9 w-9 text-[2.2rem] opacity-80 transition group-hover:opacity-100 md:block" />
                <span className="font-display text-3xl transition-transform duration-500 ease-lux group-hover:translate-x-3 md:text-5xl">{b.name}</span>
                <span className="hidden text-sm italic text-mist md:block">{b.tagline}</span>
                <span className="hidden text-xs uppercase tracking-[0.2em] text-mist md:block">{b.country} · {b.founded}</span>
                <span className="text-xs text-gold">{b.count} {b.count === 1 ? "car" : "cars"} →</span>
              </button>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function PrivateClient() {
  const [state, action, pending] = useActionState(subscribe, null);
  return (
    <section className="relative overflow-hidden border-t border-white/5">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[140px]" />
      <div className="relative mx-auto max-w-3xl px-5 py-32 text-center">
        <p className="eyebrow">Private client list</p>
        <h2 className="mt-5 font-display text-5xl leading-tight md:text-7xl">First to know. <span className="text-gilded">First to bid.</span></h2>
        <p className="mx-auto mt-5 max-w-xl text-mist">Off-market arrivals, auction previews and invitations to private viewings, before anyone else.</p>
        <form action={action} className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row">
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <input name="email" type="email" required placeholder="Your email address" className="field flex-1 !py-4" />
          <button disabled={pending} className="btn btn-primary">{pending ? "Joining…" : "Request access"}</button>
        </form>
        {state && <p className={`mt-4 text-sm ${state.ok ? "text-gold" : "text-red-300"}`}>{state.message}</p>}
      </div>
    </section>
  );
}
