"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { BodyType, CarView } from "@/lib/types";
import { bodyTypeLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { CarCard } from "@/components/car/CarCard";
import { CarRow } from "@/components/car/CarRow";
import { useBrandWorld } from "@/components/site/useBrandWorld";

type Sort = "featured" | "price-desc" | "price-asc" | "power" | "accel";

const sorts: { key: Sort; label: string }[] = [
  { key: "featured", label: "Curated" },
  { key: "price-desc", label: "Price ↓" },
  { key: "price-asc", label: "Price ↑" },
  { key: "power", label: "Power" },
  { key: "accel", label: "0–100" },
];

export function CatalogClient({ cars, initialBrand, initialQuery }: { cars: CarView[]; initialBrand: string | null; initialQuery: string }) {
  const brands = useMemo(() => Array.from(new Map(cars.map((c) => [c.brand.slug, c.brand])).values()).sort((a, b) => a.name.localeCompare(b.name)), [cars]);
  const bodies = useMemo(() => Array.from(new Set(cars.map((c) => c.bodyType))) as BodyType[], [cars]);
  const maxPrice = useMemo(() => Math.max(...cars.map((c) => c.priceFrom), 0), [cars]);
  const minPrice = useMemo(() => Math.min(...cars.map((c) => c.priceFrom), maxPrice), [cars, maxPrice]);

  const [q, setQ] = useState(initialQuery);
  const [brand, setBrand] = useState<string | null>(initialBrand);
  const [body, setBody] = useState<BodyType | null>(null);
  const [budget, setBudget] = useState(maxPrice);
  const [sort, setSort] = useState<Sort>("featured");
  const [view, setView] = useState<"grid" | "showcase">("grid");
  const { enter } = useBrandWorld();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = cars.filter(
      (c) =>
        (!term || `${c.brand.name} ${c.model} ${c.specs.engine} ${c.brand.country}`.toLowerCase().includes(term)) &&
        (!brand || c.brand.slug === brand) &&
        (!body || c.bodyType === body) &&
        c.priceFrom <= budget,
    );
    const by: Record<Sort, (a: CarView, b: CarView) => number> = {
      featured: (a, b) => Number(b.featured) - Number(a.featured),
      "price-desc": (a, b) => b.priceFrom - a.priceFrom,
      "price-asc": (a, b) => a.priceFrom - b.priceFrom,
      power: (a, b) => b.specs.powerHp - a.specs.powerHp,
      accel: (a, b) => a.specs.zeroToHundred - b.specs.zeroToHundred,
    };
    return [...list].sort(by[sort]);
  }, [cars, q, brand, body, budget, sort]);

  const active = brands.find((b) => b.slug === brand);
  const chip = (on: boolean) => `shrink-0 whitespace-nowrap px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] border transition ${on ? "border-gold bg-gold text-ink" : "border-white/15 text-ivory/70 hover:border-gold/60 hover:text-ivory"}`;

  return (
    <>
      <div className="relative z-30 -mx-5 mt-12 border-y border-white/5 bg-ink/80 px-5 py-3.5 backdrop-blur-xl md:-mx-10 md:px-10 lg:sticky lg:top-[72px]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
          <div className="no-scrollbar -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 [mask-image:linear-gradient(90deg,#000_92%,transparent)]" data-lenis-prevent>
            <button className={chip(!brand)} style={{ borderRadius: "var(--radius)" }} onClick={() => setBrand(null)}>All marques</button>
            {brands.map((b) => (
              <button key={b.slug} className={chip(brand === b.slug)} style={{ borderRadius: "var(--radius)" }} onClick={() => setBrand(brand === b.slug ? null : b.slug)}>
                {b.name}
              </button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand, model, engine…" className="w-full border-b border-white/15 bg-transparent py-2 text-sm outline-none transition placeholder:text-mist focus:border-gold xl:w-72" />
        </div>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto">
            <button className={chip(!body)} style={{ borderRadius: "var(--radius)" }} onClick={() => setBody(null)}>All types</button>
            {bodies.map((b) => (
              <button key={b} className={chip(body === b)} style={{ borderRadius: "var(--radius)" }} onClick={() => setBody(body === b ? null : b)}>{bodyTypeLabel[b]}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 text-xs text-mist">
              Up to <span className="w-20 text-ivory">{formatPrice(budget, { compact: true })}</span>
              <input type="range" min={minPrice} max={maxPrice} step={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-40" />
            </label>
            <div className="flex gap-1">
              {sorts.map((s) => (
                <button key={s.key} onClick={() => setSort(s.key)} className={`px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${sort === s.key ? "text-gold" : "text-mist hover:text-ivory"}`}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-mist">
          <motion.span key={results.length} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="inline-block text-ivory">{results.length}</motion.span> {results.length === 1 ? "automobile" : "automobiles"}
        </p>
        <div className="flex items-center gap-6">
          {active && (
            <button onClick={() => enter(active.slug, active.accentHex, active.name)} className="text-[11px] uppercase tracking-[0.22em] text-gold hover:text-gold-soft">
              Enter the {active.name} world →
            </button>
          )}
          <div className="flex rounded-full border border-white/15 p-1" role="group" aria-label="View">
            {(["grid", "showcase"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`relative rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${view === v ? "text-ink" : "text-mist hover:text-ivory"}`}>
                {view === v && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-gold" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative">{v === "grid" ? "Grid" : "Showcase"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <motion.div layout className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {results.map((car, i) => (
              <motion.div key={car.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <CarCard car={car} priority={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div layout className="mt-6 grid gap-5">
          <AnimatePresence mode="popLayout">
            {results.map((car, i) => <CarRow key={car.id} car={car} index={i} />)}
          </AnimatePresence>
        </motion.div>
      )}

      {results.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-4xl">Nothing matches — yet.</p>
          <p className="mt-3 text-sm text-mist">Widen your budget or clear a filter. Our concierge can also source off-market.</p>
        </div>
      )}
    </>
  );
}
