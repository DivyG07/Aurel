import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getIcon } from "@/lib/icons";
import { BrandMark } from "@/components/site/BrandMark";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getIcon((await params).slug);
  return p ? { title: `${p.name}'s cars`, description: p.bio ?? undefined } : {};
}

export default async function IconPage({ params }: Params) {
  const p = await getIcon((await params).slug);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-28 pt-32 md:px-10">
      <Link href="/icons" className="text-[11px] uppercase tracking-[0.25em] text-mist hover:text-gold">← All icons</Link>
      <p className="eyebrow mt-8">{p.profession}{p.country ? ` · ${p.country}` : ""}</p>
      <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">{p.name}</h1>
      {p.bio && <p className="mt-5 max-w-2xl text-mist">{p.bio}</p>}

      <div className="mt-14 space-y-5">
        {p.cars.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.05}>
            <article className="grid overflow-hidden border border-white/[0.07] bg-onyx md:grid-cols-[320px_1fr]" style={{ borderRadius: "var(--radius)" }}>
              <div className="relative aspect-[16/10] bg-graphite md:aspect-auto">
                {c.catalog?.heroImage ? (
                  <Image src={c.catalog.heroImage} alt={`${c.make} ${c.model}`} fill sizes="320px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    {c.brandSlug ? <BrandMark slug={c.brandSlug} name={c.make} className="h-16 w-16 text-[5rem] text-gold/70" /> : <span className="font-display text-3xl text-white/20">{c.make}</span>}
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8">
                <p className="eyebrow">{c.make}{c.year ? ` · ${c.year}` : ""}</p>
                <h2 className="mt-2 font-display text-3xl">{c.model}</h2>
                {c.story && <p className="mt-3 text-sm leading-relaxed text-ivory/80">{c.story}</p>}
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
                  <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-mist underline decoration-white/20 underline-offset-4 hover:text-gold">
                    Source: {c.sourceName ?? new URL(c.sourceUrl).hostname.replace("www.", "")} ↗
                  </a>
                  {c.catalog && (
                    <Link href={`/cars/${c.catalog.slug}`} className="btn btn-primary !px-4 !py-2.5">View the {c.catalog.model} in the showroom</Link>
                  )}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-12 text-xs leading-relaxed text-mist">Compiled from the press reports linked above; ownership may have changed since publication. {p.name} is not affiliated with and does not endorse this showroom.</p>
    </div>
  );
}
