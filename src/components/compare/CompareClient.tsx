"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CarView } from "@/lib/types";
import { bodyTypeLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCompare } from "@/lib/stores";

type Slot = { slug: string; variantId: string; colorId: string } | null;

interface Row {
  label: string;
  get: (c: CarView, s: NonNullable<Slot>) => number | string | null;
  unit?: string;
  better?: "high" | "low";
  fmt?: (v: number) => string;
}

const resolved = (c: CarView, s: NonNullable<Slot>) => {
  const v = c.variants.find((x) => x.id === s.variantId) ?? c.variants[0];
  const col = c.colors.find((x) => x.id === s.colorId);
  return {
    powerHp: v?.powerHp ?? c.specs.powerHp,
    torqueNm: v?.torqueNm ?? c.specs.torqueNm,
    zeroToHundred: v?.zeroToHundred ?? c.specs.zeroToHundred,
    topSpeedKmh: v?.topSpeedKmh ?? c.specs.topSpeedKmh,
    price: c.priceFrom + (v?.priceDelta ?? 0) + (col?.priceDelta ?? 0),
  };
};

const rows: Row[] = [
  { label: "Price as configured", get: (c, s) => resolved(c, s).price, better: "low", fmt: (v) => formatPrice(v) },
  { label: "Power", get: (c, s) => resolved(c, s).powerHp, unit: "hp", better: "high" },
  { label: "Torque", get: (c, s) => resolved(c, s).torqueNm, unit: "Nm", better: "high" },
  { label: "0–100 km/h", get: (c, s) => resolved(c, s).zeroToHundred, unit: "s", better: "low" },
  { label: "Top speed", get: (c, s) => resolved(c, s).topSpeedKmh, unit: "km/h", better: "high" },
  { label: "Weight", get: (c) => c.specs.weightKg, unit: "kg", better: "low", fmt: (v) => v.toLocaleString() },
  { label: "Power-to-weight", get: (c, s) => (c.specs.weightKg ? Math.round((resolved(c, s).powerHp / c.specs.weightKg) * 1000) : null), unit: "hp/t", better: "high" },
  { label: "Seats", get: (c) => c.specs.seats, better: "high" },
  { label: "Engine", get: (c) => c.specs.engine },
  { label: "Drivetrain", get: (c) => c.specs.drivetrain },
  { label: "Transmission", get: (c) => c.specs.transmission },
  { label: "Body", get: (c) => bodyTypeLabel[c.bodyType] },
  { label: "Origin", get: (c) => c.brand.country },
];

export function CompareClient({ cars, initial }: { cars: CarView[]; initial: string[] }) {
  const bySlug = useMemo(() => new Map(cars.map((c) => [c.slug, c])), [cars]);
  const tray = useCompare();
  const mk = (slug: string): Slot => {
    const c = bySlug.get(slug);
    return c ? { slug, variantId: c.variants[0]?.id ?? "", colorId: c.colors.find((x) => x.kind === "EXTERIOR")?.id ?? "" } : null;
  };
  const [slots, setSlots] = useState<Slot[]>(() => [0, 1, 2].map((i) => (initial[i] ? mk(initial[i]) : null)));
  const [diffOnly, setDiffOnly] = useState(false);

  // First visit without ?cars= → take what's in the compare tray.
  useEffect(() => {
    if (!initial.length && tray.items.length) setSlots([0, 1, 2].map((i) => (tray.items[i] ? mk(tray.items[i].slug) : null)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL and tray in sync with the chosen cars.
  useEffect(() => {
    const chosen = slots.filter(Boolean).map((s) => s!.slug);
    window.history.replaceState(null, "", chosen.length ? `?cars=${chosen.join(",")}` : "?");
    const items = chosen.map((s) => {
      const c = bySlug.get(s)!;
      return { slug: s, name: `${c.brand.name} ${c.model}`, image: c.heroImage };
    });
    useCompare.setState({ items });
  }, [slots, bySlug]);

  const set = (i: number, s: Slot) => setSlots((prev) => prev.map((x, n) => (n === i ? s : x)));
  const active = slots.map((s) => (s ? { s, c: bySlug.get(s.slug)! } : null));
  const filled = active.filter(Boolean) as { s: NonNullable<Slot>; c: CarView }[];

  const visibleRows = rows.filter((r) => {
    if (!diffOnly || filled.length < 2) return true;
    const vals = filled.map(({ c, s }) => String(r.get(c, s)));
    return new Set(vals).size > 1;
  });

  return (
    <div className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-xs uppercase tracking-[0.2em] text-mist">
          <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Show differences only
        </label>
        {filled.length > 0 && <button onClick={() => setSlots([null, null, null])} className="text-xs uppercase tracking-[0.2em] text-mist hover:text-ivory">Clear all</button>}
      </div>

      <div className="overflow-x-auto" data-lenis-prevent>
        <div className="grid min-w-[860px] grid-cols-[200px_repeat(3,1fr)] gap-x-4">
          <div />
          {active.map((slot, i) => (
            <div key={i} className="border border-white/[0.07] bg-onyx" style={{ borderRadius: "var(--radius)" }}>
              <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
                <AnimatePresence mode="wait">
                  {slot?.c.heroImage ? (
                    <motion.div key={slot.c.slug} className="absolute inset-0" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                      <Image src={slot.c.heroImage} alt="" fill sizes="30vw" className="object-cover object-[50%_58%]" />
                    </motion.div>
                  ) : (
                    <motion.div key="empty" className="grid h-full place-items-center text-xs uppercase tracking-[0.25em] text-mist" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Choose a car</motion.div>
                  )}
                </AnimatePresence>
                {slot && <button onClick={() => set(i, null)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-sm" aria-label="Remove">×</button>}
              </div>
              <div className="space-y-3 p-4">
                <select value={slot?.s.slug ?? ""} onChange={(e) => set(i, e.target.value ? mk(e.target.value) : null)} className="field !py-2.5 text-sm">
                  <option value="">Select a car…</option>
                  {cars.map((c) => (
                    <option key={c.slug} value={c.slug} disabled={slots.some((s, n) => n !== i && s?.slug === c.slug)}>{c.brand.name} {c.model}</option>
                  ))}
                </select>
                {slot && slot.c.variants.length > 1 && (
                  <select value={slot.s.variantId} onChange={(e) => set(i, { ...slot.s, variantId: e.target.value })} className="field !py-2 text-xs">
                    {slot.c.variants.map((v) => <option key={v.id} value={v.id}>{v.name}{v.priceDelta ? ` (${v.priceDelta > 0 ? "+" : "−"}${formatPrice(Math.abs(v.priceDelta))})` : ""}</option>)}
                  </select>
                )}
                {slot && (
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {slot.c.colors.filter((x) => x.kind === "EXTERIOR").map((col) => (
                        <button key={col.id} onClick={() => set(i, { ...slot.s, colorId: col.id })} title={col.name} aria-label={col.name} className={`h-6 w-6 rounded-full border transition ${col.id === slot.s.colorId ? "scale-110 border-gold ring-2 ring-gold/30" : "border-white/20"}`} style={{ background: col.hex }} />
                      ))}
                    </div>
                    <p className="mt-2 truncate text-[11px] text-mist">{slot.c.colors.find((x) => x.id === slot.s.colorId)?.name}</p>
                  </div>
                )}
                {slot && <Link href={`/cars/${slot.c.slug}?variant=${slot.s.variantId}&color=${slot.s.colorId}`} className="block text-[10px] uppercase tracking-[0.2em] text-gold hover:text-gold-soft">Open in showroom →</Link>}
              </div>
            </div>
          ))}

          {visibleRows.map((r) => {
            const vals = active.map((slot) => (slot ? r.get(slot.c, slot.s) : null));
            const nums = vals.filter((v): v is number => typeof v === "number");
            const best = r.better && nums.length > 1 ? (r.better === "high" ? Math.max(...nums) : Math.min(...nums)) : null;
            const max = nums.length ? Math.max(...nums) : 0;
            return (
              <div key={r.label} className="contents">
                <div className="flex items-center border-b border-white/[0.06] py-4 text-[10px] uppercase tracking-[0.22em] text-mist">{r.label}</div>
                {vals.map((v, i) => (
                  <div key={i} className="border-b border-white/[0.06] px-4 py-4">
                    {v == null ? (
                      <span className="text-mist">—</span>
                    ) : (
                      <>
                        <motion.p key={String(v)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`text-sm ${best != null && v === best ? "font-semibold text-gold" : "text-ivory"}`}>
                          {typeof v === "number" ? (r.fmt ? r.fmt(v) : v) : v}
                          {r.unit && typeof v === "number" && <span className="ml-1 text-xs text-mist">{r.unit}</span>}
                          {best != null && v === best && <span className="ml-2 text-[9px] uppercase tracking-[0.2em]">Best</span>}
                        </motion.p>
                        {typeof v === "number" && r.better && max > 0 && (
                          <div className="mt-2 h-[3px] bg-white/5">
                            <motion.div className="h-full" style={{ background: best != null && v === best ? "var(--accent)" : "color-mix(in oklab, var(--text) 30%, transparent)" }} initial={{ width: 0 }} animate={{ width: `${(v / max) * 100}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
