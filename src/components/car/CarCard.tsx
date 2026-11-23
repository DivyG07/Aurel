"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { CarView } from "@/lib/types";
import { bodyTypeLabel, statusLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { WishlistButton } from "@/components/site/WishlistButton";
import { CompareButton } from "@/components/compare/CompareTray";

/** Collection card: real photo banner (crossfades to a second angle on hover), tilt and a following glow. */
export function CarCard({ car, priority }: { car: CarView; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [4, -4]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-5, 5]), { stiffness: 180, damping: 20 });
  const glow = useTransform([mx, my], ([x, y]: number[]) => `radial-gradient(500px circle at ${x * 100}% ${y * 100}%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 55%)`);
  const second = car.photos[1]?.url;
  const name = `${car.brand.name} ${car.model}`;

  return (
    <motion.div style={{ perspective: 1200 }} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div style={{ rotateX: rx, rotateY: ry }}>
        <Link
          ref={ref}
          href={`/cars/${car.slug}`}
          onPointerMove={(e) => {
            const r = ref.current!.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width);
            my.set((e.clientY - r.top) / r.height);
          }}
          onPointerLeave={() => {
            mx.set(0.5);
            my.set(0.5);
          }}
          className="group relative block overflow-hidden border border-white/[0.07] bg-onyx transition-colors duration-500 hover:border-gold/40"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
            {car.heroImage ? (
              <>
                <Image src={car.heroImage} alt={name} fill priority={priority} sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw" className={`object-cover transition duration-[1.4s] ease-lux group-hover:scale-[1.04] ${second ? "group-hover:opacity-0" : ""}`} />
                {second && <Image src={second} alt="" fill sizes="(min-width:1280px) 33vw, 50vw" className="scale-[1.04] object-cover opacity-0 transition duration-[1.4s] ease-lux group-hover:scale-100 group-hover:opacity-100" />}
              </>
            ) : (
              <div className="grid h-full place-items-center font-display text-3xl text-white/15">{car.brand.name}</div>
            )}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute right-3 top-3 flex gap-2">
              <CompareButton item={{ slug: car.slug, name, image: car.heroImage }} />
              <WishlistButton slug={car.slug} name={name} />
            </div>
            <span className={`absolute left-3 top-3 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur ${car.status === "AVAILABLE" ? "bg-black/50 text-emerald-300" : "bg-gold text-ink"}`}>{statusLabel[car.status]}</span>
            {car.sketchfabUid && <span className="absolute bottom-3 right-3 rounded-full border border-white/25 bg-black/50 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] backdrop-blur">360°</span>}
          </div>
          <div className="relative p-6">
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
            <p className="eyebrow">{car.brand.name}</p>
            <h3 className="mt-2 font-display text-3xl leading-none">{car.model}</h3>
            <p className="mt-2 text-xs text-mist">{car.year} · {bodyTypeLabel[car.bodyType]}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-5 text-center">
              <Stat label="Power" value={`${car.specs.powerHp} hp`} />
              <Stat label="0–100" value={`${car.specs.zeroToHundred}s`} />
              <Stat label="Top" value={`${car.specs.topSpeedKmh} km/h`} />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <p className="font-display text-2xl text-gilded">{formatPrice(car.priceFrom)}</p>
              <span className="text-[10px] uppercase tracking-[0.2em] text-mist transition group-hover:text-gold">Explore →</span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.25em] text-mist">{label}</p>
      <p className="mt-1 text-sm text-ivory">{value}</p>
    </div>
  );
}
