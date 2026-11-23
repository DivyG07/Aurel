import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCars } from "@/lib/cars";
import { getAuctions } from "@/lib/auctions";
import { themeFor } from "@/lib/themes";
import { formatPrice } from "@/lib/format";
import { Hero } from "@/components/home/Hero";
import { CarCard } from "@/components/car/CarCard";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Reveal, SplitHeading } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";
import { EnterWorld } from "./EnterWorld";
import { getBrandVideos } from "@/lib/media";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const b = await db.brand.findUnique({ where: { slug: (await params).slug } });
  return b ? { title: `${b.name} World`, description: b.tagline ?? undefined } : {};
}

export default async function BrandWorld({ params }: Params) {
  const { slug } = await params;
  const brand = await db.brand.findUnique({ where: { slug } });
  if (!brand) notFound();
  const [cars, auctions] = await Promise.all([getCars({ brand: slug }), getAuctions()]);
  const theme = themeFor(brand.slug, brand.accentHex, brand.name);
  const lots = auctions.filter((a) => a.car.brandSlug === slug && (a.phase === "LIVE" || a.phase === "UPCOMING"));
  const fastest = cars.length ? Math.min(...cars.map((c) => c.specs.zeroToHundred)) : 0;
  const strongest = cars.length ? Math.max(...cars.map((c) => c.specs.powerHp)) : 0;
  const age = new Date().getFullYear() - brand.founded;

  return (
    <>
      <EnterWorld slug={brand.slug} accentHex={brand.accentHex} name={brand.name} />
      {cars.some((c) => c.heroImage) || getBrandVideos(brand.slug).length ? (
        <Hero cars={cars} videos={getBrandVideos(brand.slug)} cutEveryMs={5000} cta={{ href: `/cars?brand=${brand.slug}`, label: `Explore ${brand.name}` }} eyebrow={`${brand.country} · Since ${brand.founded}`} title={[brand.name, theme.motto || brand.tagline || ""]} />
      ) : (
        <section className="flex h-[70svh] items-end px-5 pb-16 md:px-10"><h1 className="font-display text-7xl">{brand.name}</h1></section>
      )}

      <section className="mx-auto grid max-w-[1480px] grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
        {[
          { label: "Years of heritage", node: <Counter value={age} /> },
          { label: "Models in residence", node: <Counter value={cars.length} /> },
          { label: "Most powerful", node: <><Counter value={strongest} /> <span className="text-xl text-gold">hp</span></> },
          { label: "Quickest 0–100", node: <><Counter value={fastest} decimals={1} /> <span className="text-xl text-gold">s</span></> },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="bg-ink px-6 py-14 md:px-10">
            <p className="font-display text-5xl md:text-6xl">{s.node}</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-mist">{s.label}</p>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto max-w-[1480px] px-5 py-24 md:px-10">
        <p className="eyebrow">The {brand.name} collection</p>
        <h2 className="mt-4 font-display text-5xl md:text-7xl"><SplitHeading text={brand.tagline ?? brand.name} /></h2>
        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cars.map((car, i) => <CarCard key={car.id} car={car} priority={i < 2} />)}
        </div>
        {!cars.length && <p className="mt-10 text-mist">No {brand.name} models in residence right now. Our concierge can source one for you.</p>}
        {cars.length > 0 && (
          <p className="mt-10 text-sm text-mist">
            From {formatPrice(Math.min(...cars.map((c) => c.priceFrom)))} to {formatPrice(Math.max(...cars.map((c) => c.priceFrom)))}.
          </p>
        )}
      </section>

      {lots.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-5 pb-24 md:px-10">
          <p className="eyebrow">{brand.name} at auction</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {lots.map((a) => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </section>
      )}
    </>
  );
}
