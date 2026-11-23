"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import type { CarView } from "@/lib/types";
import { bodyTypeLabel, statusLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { WishlistButton } from "@/components/site/WishlistButton";
import { CompareButton } from "@/components/compare/CompareTray";

const clamp = (n: number) => Math.max(0.06, Math.min(1, n));

/**
 * Collection card. Full-bleed photo with:
 * - hover-scrub: sliding the pointer across the card flips through the car's photos (dots show where you are)
 * - 3D tilt, a parallax photo that drifts against the pointer, and a glare that follows it
 * - an accent ring that sweeps round the border, plus spec bars that charge up on hover
 */
export function CarCard({ car, priority, index = 0 }: { car: CarView; priority?: boolean; index?: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [shot, setShot] = useState(0);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const spring = { stiffness: 160, damping: 18, mass: 0.6 };
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), spring);
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), spring);
  const px = useSpring(useTransform(mx, [0, 1], [10, -10]), spring);
  const py = useSpring(useTransform(my, [0, 1], [8, -8]), spring);
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.16), transparent 45%)`;

  const name = `${car.brand.name} ${car.model}`;
  const shots = useMemo(() => {
    const list = [car.heroImage, ...car.photos.map((p) => p.url)].filter((u): u is string => !!u);
    return [...new Set(list)].slice(0, 4);
  }, [car.heroImage, car.photos]);

  const bars = [
    { label: "Power", value: `${car.specs.powerHp} hp`, pct: clamp(car.specs.powerHp / 1600) },
    { label: "0–100", value: `${car.specs.zeroToHundred}s`, pct: clamp((6 - car.specs.zeroToHundred) / 4) },
    { label: "Top speed", value: `${car.specs.topSpeedKmh} km/h`, pct: clamp(car.specs.topSpeedKmh / 450) },
  ];

  return (
    <motion.div
      style={{ perspective: 1100 }}
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7, delay: Math.min(index % 3, 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="group/card relative">
        {/* sweeping accent ring */}
        <div aria-hidden className="card-ring pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" style={{ borderRadius: "calc(var(--radius) + 1px)" }} />
        <Link
          ref={ref}
          href={`/cars/${car.slug}`}
          onPointerEnter={() => setHovered(true)}
          onPointerMove={(e) => {
            const r = ref.current!.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            mx.set(x);
            my.set((e.clientY - r.top) / r.height);
            if (shots.length > 1) setShot(Math.min(shots.length - 1, Math.floor(x * shots.length)));
          }}
          onPointerLeave={() => {
            mx.set(0.5);
            my.set(0.5);
            setShot(0);
          }}
          className="relative block aspect-[4/5] overflow-hidden border border-white/[0.08] bg-onyx shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-500 group-hover/card:border-transparent group-hover/card:shadow-[0_40px_80px_-30px_color-mix(in_oklab,var(--accent)_35%,black)]"
          style={{ borderRadius: "var(--radius)" }}
        >
          {/* photos */}
          <motion.div className="absolute -inset-4" style={{ x: px, y: py }}>
            {shots.length ? (
              shots.map((src, i) =>
                i === 0 || hovered ? (
                  <Image
                    key={src}
                    src={src}
                    alt={i === 0 ? name : ""}
                    fill
                    priority={priority && i === 0}
                    sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw"
                    className={`object-cover transition-[opacity,transform] duration-700 ease-lux ${shot === i ? "opacity-100" : "opacity-0"} ${hovered ? "scale-[1.06]" : "scale-100"}`}
                  />
                ) : null,
              )
            ) : (
              <div className="grid h-full place-items-center bg-graphite font-display text-4xl text-white/15">{car.brand.name}</div>
            )}
          </motion.div>

          {/* shading + glare */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,transparent_22%,transparent_42%,rgba(0,0,0,0.75)_72%,rgba(0,0,0,0.95)_100%)]" />
          <motion.div className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover/card:opacity-100" style={{ background: glare }} />

          {/* top row */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur-md ${car.status === "AVAILABLE" ? "bg-black/45 text-emerald-300" : "bg-gold text-ink"}`}>{statusLabel[car.status]}</span>
              {car.sketchfabUid && <span className="rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] backdrop-blur-md">360°</span>}
            </div>
            <div className="flex translate-y-0 gap-2 transition duration-500 md:-translate-y-2 md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100">
              <CompareButton item={{ slug: car.slug, name, image: car.heroImage }} />
              <WishlistButton slug={car.slug} name={name} />
            </div>
          </div>

          {/* scrub dots */}
          {shots.length > 1 && (
            <div className="absolute inset-x-0 top-[46%] flex justify-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
              {shots.map((s, i) => (
                <span key={s} className={`h-[3px] rounded-full transition-all duration-300 ${i === shot ? "w-6 bg-gold" : "w-3 bg-white/40"}`} />
              ))}
            </div>
          )}

          {/* bottom content */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6" style={{ transform: "translateZ(40px)" }}>
            <p className="eyebrow">{car.brand.name}</p>
            <h3 className="mt-1.5 font-display text-[2rem] leading-[0.95] text-ivory sm:text-[2.2rem]">{car.model}</h3>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/60">{car.year} · {bodyTypeLabel[car.bodyType]}</p>

            {/* spec bars: collapsed until hover on desktop, always visible on touch */}
            <div className="grid transition-[grid-template-rows,opacity,margin] duration-500 ease-lux md:grid-rows-[0fr] md:opacity-0 md:group-hover/card:mt-1 md:group-hover/card:grid-rows-[1fr] md:group-hover/card:opacity-100 grid-rows-[1fr]">
              <div className="overflow-hidden">
                <div className="mt-4 space-y-2.5">
                  {bars.map((b, i) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-[10px] uppercase tracking-[0.2em]">
                        <span className="text-white/55">{b.label}</span>
                        <span className="text-ivory">{b.value}</span>
                      </div>
                      <div className="mt-1 h-[2px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full origin-left rounded-full bg-gradient-to-r from-gold/60 to-gold transition-transform duration-700 ease-lux md:scale-x-0 md:group-hover/card:scale-x-100"
                          style={{ width: `${b.pct * 100}%`, transitionDelay: hovered ? `${120 + i * 90}ms` : "0ms" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/50">From</p>
                <p className="font-display text-2xl leading-tight text-gilded">{formatPrice(car.priceFrom)}</p>
              </div>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/70 transition-colors group-hover/card:text-gold">
                Explore
                <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 transition-all duration-500 group-hover/card:rotate-[-45deg] group-hover/card:border-gold group-hover/card:bg-gold group-hover/card:text-ink">→</span>
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
