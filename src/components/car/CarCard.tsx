"use client";

import Link from "next/link";
import Image from "next/image";
import type { CarView } from "@/lib/types";
import { bodyTypeLabel, statusLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { WishlistButton } from "@/components/site/WishlistButton";
import { CompareButton } from "@/components/compare/CompareTray";

/**
 * Collection card: quiet and editorial. A full (uncropped-feeling) photo banner that softly
 * crossfades to a second angle on hover — no zoom, no tilt — with restrained type below.
 */
export function CarCard({ car, priority }: { car: CarView; priority?: boolean; index?: number }) {
  const second = car.photos.find((p) => p.url !== car.heroImage)?.url;
  const name = `${car.brand.name} ${car.model}`;

  return (
    <Link
      href={`/cars/${car.slug}`}
      className="group relative block overflow-hidden border border-white/[0.07] bg-onyx/70 transition-[border-color,transform] duration-500 ease-lux hover:-translate-y-1 hover:border-gold/35"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
        {car.heroImage ? (
          <>
            <Image src={car.heroImage} alt={name} fill priority={priority} sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw" className={`object-cover transition-opacity duration-700 ease-lux ${second ? "group-hover:opacity-0" : ""}`} />
            {second && <Image src={second} alt="" fill loading="lazy" sizes="(min-width:1280px) 33vw, 50vw" className="object-cover opacity-0 transition-opacity duration-700 ease-lux group-hover:opacity-100" />}
          </>
        ) : (
          <div className="grid h-full place-items-center font-display text-3xl text-white/15">{car.brand.name}</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="absolute right-3 top-3 flex gap-2">
          <CompareButton item={{ slug: car.slug, name, image: car.heroImage }} />
          <WishlistButton slug={car.slug} name={name} />
        </div>
        {car.status !== "AVAILABLE" && <span className="absolute left-3 top-3 bg-gold px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink">{statusLabel[car.status]}</span>}
      </div>

      <div className="p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow">{car.brand.name}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-mist">{car.year}{car.sketchfabUid ? " · 360°" : ""}</p>
        </div>
        <h3 className="mt-2 font-display text-[1.9rem] leading-none">{car.model}</h3>
        <p className="mt-2 text-xs text-mist">{bodyTypeLabel[car.bodyType]} · {car.specs.powerHp} hp · {car.specs.zeroToHundred}s 0–100</p>
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-5">
          <p className="font-display text-2xl text-gilded">{formatPrice(car.priceFrom)}</p>
          <span className="text-[10px] uppercase tracking-[0.22em] text-mist transition-colors duration-500 group-hover:text-gold">
            View <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
