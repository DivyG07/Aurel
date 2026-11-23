"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import type { CarView } from "@/lib/types";
import { bodyTypeLabel, statusLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { WishlistButton } from "@/components/site/WishlistButton";
import { CompareButton } from "@/components/compare/CompareTray";

/** Wide "showcase" row for the collection's list view: large photo, specs laid out like a spec sheet. */
export function CarRow({ car, index }: { car: CarView; index: number }) {
  const name = `${car.brand.name} ${car.model}`;
  const specs = [
    ["Power", `${car.specs.powerHp} hp`],
    ["0–100", `${car.specs.zeroToHundred}s`],
    ["Top speed", `${car.specs.topSpeedKmh} km/h`],
    ["Engine", car.specs.engine],
  ];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/cars/${car.slug}`}
        className="group/card relative grid overflow-hidden border border-white/[0.07] bg-onyx/80 transition-colors duration-500 hover:border-gold/40 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
        style={{ borderRadius: "var(--radius)" }}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-graphite md:aspect-auto md:min-h-[300px]">
          {car.heroImage && <Image src={car.heroImage} alt={name} fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover transition duration-[1.6s] ease-lux group-hover/card:scale-[1.06]" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-onyx/90 max-md:hidden" />
          <span className="absolute left-4 top-4 font-display text-6xl leading-none text-white/20">{String(index + 1).padStart(2, "0")}</span>
          <div className="absolute right-4 top-4 flex gap-2 md:hidden">
            <CompareButton item={{ slug: car.slug, name, image: car.heroImage }} />
            <WishlistButton slug={car.slug} name={name} />
          </div>
        </div>
        <div className="relative flex flex-col p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{car.brand.name} · {car.brand.country}</p>
              <h3 className="mt-2 font-display text-4xl leading-none md:text-5xl">{car.model}</h3>
              <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-mist">
                {car.year} · {bodyTypeLabel[car.bodyType]} · <span className={car.status === "AVAILABLE" ? "text-emerald-300" : "text-gold"}>{statusLabel[car.status]}</span>
                {car.sketchfabUid && " · 360°"}
              </p>
            </div>
            <div className="hidden gap-2 md:flex">
              <CompareButton item={{ slug: car.slug, name, image: car.heroImage }} />
              <WishlistButton slug={car.slug} name={name} />
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/[0.07] pt-6">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[9px] uppercase tracking-[0.25em] text-mist">{k}</dt>
                <dd className="mt-1 truncate text-sm text-ivory">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto flex items-end justify-between pt-6">
            <p className="font-display text-3xl text-gilded">{formatPrice(car.priceFrom)}</p>
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-all duration-500 group-hover/card:rotate-[-45deg] group-hover/card:border-gold group-hover/card:bg-gold group-hover/card:text-ink">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
