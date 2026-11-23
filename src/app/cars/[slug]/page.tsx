import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarExperience } from "@/components/car/CarExperience";
import { CarCard } from "@/components/car/CarCard";
import { getCarBySlug, getRelatedCars, recordView } from "@/lib/cars";
import { getOwnersOfCar } from "@/lib/icons";
import { razorpayConfigured } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const car = await getCarBySlug((await params).slug);
  return car ? { title: `${car.brand.name} ${car.model}`, description: car.tagline, openGraph: car.heroImage ? { images: [car.heroImage] } : undefined } : {};
}

export default async function CarPage({ params, searchParams }: Params) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const car = await getCarBySlug(slug);
  if (!car) notFound();
  const [related, owners] = await Promise.all([getRelatedCars(car), getOwnersOfCar(car.id), recordView(slug)]);

  return (
    <>
      <CarExperience car={car} paymentsEnabled={razorpayConfigured()} initial={{ variant: sp.variant, color: sp.color, interior: sp.interior, caliper: sp.caliper, view: sp.view }} />
      {owners.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-5 pb-20 md:px-10">
          <p className="eyebrow">Famous owners</p>
          <h2 className="mt-3 font-display text-4xl">In good company</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {owners.map((o) => (
              <div key={o.slug + o.model} className="border border-white/[0.07] bg-onyx p-6" style={{ borderRadius: "var(--radius)" }}>
                <div className="flex items-center gap-4">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gold/50 bg-gold/15">
                    {o.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.image} alt="" className={`h-full w-full object-cover ${o.imageFocus === "top" ? "object-top" : ""}`} />
                    ) : (
                      <span className="grid h-full w-full place-items-center font-display text-lg text-gold">{o.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>
                    )}
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-mist">{o.profession}</p>
                    <Link href={`/icons/${o.slug}`} className="mt-0.5 block font-display text-2xl hover:text-gold">{o.name}</Link>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gold">{o.model}</p>
                {o.story && <p className="mt-3 text-sm leading-relaxed text-ivory/75">{o.story}</p>}
                {o.sourceUrl ? (
                  <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-block text-[11px] text-mist underline decoration-white/20 underline-offset-4 hover:text-gold">
                    Source: {o.sourceName ?? "press report"} ↗
                  </a>
                ) : (
                  <p className="mt-3 text-[11px] text-mist">{o.sourceName ?? "Shared by the owner"}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-5 pb-24 md:px-10">
          <p className="eyebrow">You may also consider</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {related.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        </section>
      )}
    </>
  );
}
