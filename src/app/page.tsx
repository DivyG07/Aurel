import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Hero } from "@/components/home/Hero";
import { Experiences, LiveAuctionStrip, Marques, Marquee, PrivateClient, Stats } from "@/components/home/Sections";
import { CarCard } from "@/components/car/CarCard";
import { SplitHeading } from "@/components/ui/Reveal";
import { getBrands, getCars } from "@/lib/cars";
import { getAuctions } from "@/lib/auctions";
import { COOKIE } from "@/lib/themes";
import { getHeroVideos } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Inside a brand world, home is that brand's showroom.
  const world = (await cookies()).get(COOKIE)?.value;
  if (world) {
    const exists = (await getBrands()).some((b) => b.slug === world);
    if (exists) redirect(`/brands/${world}`);
  }

  const [cars, brands, auctions] = await Promise.all([getCars(), getBrands(), getAuctions()]);
  const featured = cars.filter((c) => c.featured);
  const live = auctions.filter((a) => a.phase === "LIVE");

  return (
    <>
      <Hero cars={featured.length ? featured : cars.slice(0, 6)} videos={getHeroVideos()} cutEveryMs={4000} eyebrow="Private Collection · Virtual Showroom" title={["Where icons", "find their keepers"]} />
      <Marquee items={brands.map((b) => b.name)} />
      {live[0] && <LiveAuctionStrip auction={live[0]} />}

      <section className="mx-auto max-w-[1480px] px-5 py-24 md:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Now in residence</p>
            <h2 className="mt-4 font-display text-5xl md:text-7xl"><SplitHeading text="The Collection" /></h2>
          </div>
          <Link href="/cars" className="text-[11px] uppercase tracking-[0.25em] text-gold hover:text-gold-soft">Explore all {cars.length} automobiles →</Link>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featured.slice(0, 6).map((car, i) => <CarCard key={car.id} car={car} priority={i < 3} />)}
        </div>
      </section>

      <Stats cars={cars.length} brands={brands.length} value={cars.reduce((s, c) => s + c.priceFrom, 0)} live={live.length} />
      <Experiences images={cars.map((c) => c.photos[1]?.url ?? c.heroImage).filter((x): x is string => !!x).slice(2, 8)} />
      <Marques brands={brands.map((b) => ({ slug: b.slug, name: b.name, country: b.country, founded: b.founded, accentHex: b.accentHex, tagline: b.tagline, count: b._count.cars, image: b.cars[0]?.heroImage ?? null }))} />
      <PrivateClient />
    </>
  );
}
