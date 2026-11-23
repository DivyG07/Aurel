"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { GarageCarView } from "@/lib/garage";
import { deleteGarageCar, saveGarageCar, setGaragePublic } from "./actions";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { BrandMark } from "@/components/site/BrandMark";
import { Counter } from "@/components/ui/Counter";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/stores";

type CatalogCar = { slug: string; model: string; year: number; brand: string; brandSlug: string };

const F = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={`block ${className ?? ""}`}>
    <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">{label}</span>
    {children}
  </label>
);

function GarageForm({ catalog, makes, initial, onDone }: { catalog: CatalogCar[]; makes: string[]; initial?: GarageCarView; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveGarageCar, null);
  const [mode, setMode] = useState<"catalog" | "other">(initial ? (initial.catalog ? "catalog" : "other") : "catalog");
  const brands = useMemo(() => Array.from(new Map(catalog.map((c) => [c.brandSlug, c.brand])).entries()), [catalog]);
  const [brand, setBrand] = useState(initial?.catalog?.brandSlug ?? "");
  const [carSlug, setCarSlug] = useState(initial?.catalog?.slug ?? "");
  const [keep, setKeep] = useState((initial?.images ?? []).map((i) => i.id));
  const picked = catalog.find((c) => c.slug === carSlug);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      toast(state.message, "success");
      router.refresh();
      onDone();
    } else if (state) toast(state.message, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {mode === "catalog" && <input type="hidden" name="carSlug" value={carSlug} />}
      {keep.map((k) => <input key={k} type="hidden" name="keep" value={k} />)}

      <div className="flex overflow-hidden border border-white/15 sm:w-fit" style={{ borderRadius: "var(--radius)" }}>
        {([["catalog", "Choose from our catalogue"], ["other", "Any other car"]] as const).map(([k, t]) => (
          <button key={k} type="button" onClick={() => setMode(k)} className={`flex-1 px-5 py-2.5 text-[11px] uppercase tracking-[0.15em] ${mode === k ? "bg-gold text-ink" : "text-mist hover:text-ivory"}`}>{t}</button>
        ))}
      </div>

      {mode === "catalog" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Marque">
            <select value={brand} onChange={(e) => { setBrand(e.target.value); setCarSlug(""); }} className="field">
              <option value="">Choose a marque…</option>
              {brands.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </F>
          <F label="Model">
            <select value={carSlug} onChange={(e) => setCarSlug(e.target.value)} disabled={!brand} className="field disabled:opacity-40">
              <option value="">{brand ? "Choose a model…" : "Pick a marque first"}</option>
              {catalog.filter((c) => c.brandSlug === brand).map((c) => <option key={c.slug} value={c.slug}>{c.model}</option>)}
            </select>
          </F>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Make *">
            <input name="make" list="garage-makes" defaultValue={initial && !initial.catalog ? initial.make : ""} placeholder="e.g. Porsche" className="field" />
            <datalist id="garage-makes">{[...makes, "Audi", "BMW", "Mercedes-AMG", "Lexus", "Toyota", "Nissan", "Chevrolet", "Ford", "Land Rover", "Jaguar", "Tesla", "Lotus"].map((m) => <option key={m} value={m} />)}</datalist>
          </F>
          <F label="Model *"><input name="model" defaultValue={initial && !initial.catalog ? initial.model : ""} placeholder="e.g. 911 GT3 Touring" className="field" /></F>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <F label="Model year *"><input key={picked?.slug} name="year" type="number" required min={1886} max={new Date().getFullYear() + 1} defaultValue={initial?.year ?? picked?.year} className="field" /></F>
        <F label="Colour"><input name="color" defaultValue={initial?.color ?? ""} placeholder="e.g. Rosso Corsa" className="field" /></F>
        <F label="Mileage (km)"><input name="mileageKm" type="number" min={0} defaultValue={initial?.mileageKm ?? ""} className="field" /></F>
        <F label="Year acquired"><input name="acquiredYear" type="number" min={1886} max={new Date().getFullYear()} defaultValue={initial?.acquiredYear ?? ""} className="field" /></F>
        <F label="Estimated value (USD)"><input name="estValueUsd" type="number" min={0} step={1000} defaultValue={initial?.estValueUsd ?? ""} className="field" /></F>
        <label className="flex items-end gap-3 pb-3 text-sm">
          <input type="checkbox" name="isPublic" defaultChecked={initial?.isPublic ?? false} className="h-4 w-4 accent-[var(--accent)]" />
          Show in Collectors&apos; Garages
        </label>
        <F label="Notes" className="sm:col-span-3"><textarea name="notes" rows={3} maxLength={1000} defaultValue={initial?.notes ?? ""} placeholder="Options, history, what makes it special…" className="field" /></F>
      </div>

      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-mist">Your photos (up to 4)</p>
        {keep.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(initial?.images ?? []).filter((i) => keep.includes(i.id)).map((i) => (
              <div key={i.id} className="relative h-20 w-28 overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== i.id))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs" aria-label="Remove photo">×</button>
              </div>
            ))}
          </div>
        )}
        <ImagePicker name="images" max={Math.max(0, 4 - keep.length)} label="Photo" />
        {mode === "catalog" && <p className="mt-1 text-[11px] text-mist">No photo? We&apos;ll use our showroom photo of that model.</p>}
      </div>

      <div className="flex gap-3">
        <button disabled={pending || (mode === "catalog" && !carSlug)} className="btn btn-primary">{pending ? "Saving…" : initial ? "Save changes" : "Add to garage"}</button>
        <button type="button" onClick={onDone} className="btn btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export function GarageClient({ cars, catalog, makes }: { cars: GarageCarView[]; catalog: CatalogCar[]; makes: string[] }) {
  const [adding, setAdding] = useState(cars.length === 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const total = cars.reduce((s, c) => s + (c.estValueUsd ?? 0), 0);
  const marques = new Set(cars.map((c) => c.make.toLowerCase())).size;

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.message, r.ok ? "success" : "error");
      router.refresh();
    });

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
        {[
          { label: "Cars in garage", node: <Counter value={cars.length} /> },
          { label: "Marques", node: <Counter value={marques} /> },
          { label: "Estimated value", node: <Counter value={total} format={(n) => formatPrice(n, { compact: true })} /> },
          { label: "Shown publicly", node: <Counter value={cars.filter((c) => c.isPublic).length} /> },
        ].map((s) => (
          <div key={s.label} className="bg-ink px-6 py-8">
            <p className="font-display text-4xl md:text-5xl">{s.node}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-mist">{s.label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {adding ? (
          <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-10 border border-gold/30 bg-onyx p-6 md:p-8" style={{ borderRadius: "var(--radius)" }}>
              <p className="eyebrow mb-6">Add a car</p>
              <GarageForm catalog={catalog} makes={makes} onDone={() => setAdding(false)} />
            </div>
          </motion.div>
        ) : (
          <motion.button key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { setAdding(true); setEditing(null); }} className="mt-10 flex w-full items-center justify-center gap-3 border border-dashed border-white/20 py-8 text-sm uppercase tracking-[0.2em] text-mist transition hover:border-gold hover:text-gold" style={{ borderRadius: "var(--radius)" }}>
            <span className="text-2xl">+</span> Add a car to your garage
          </motion.button>
        )}
      </AnimatePresence>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {cars.map((c) =>
            editing === c.id ? (
              <motion.div key={c.id} layout className="border border-gold/30 bg-onyx p-6 md:col-span-2 xl:col-span-3" style={{ borderRadius: "var(--radius)" }}>
                <p className="eyebrow mb-6">Edit {c.make} {c.model}</p>
                <GarageForm catalog={catalog} makes={makes} initial={c} onDone={() => setEditing(null)} />
              </motion.div>
            ) : (
              <motion.article key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group overflow-hidden border border-white/[0.07] bg-onyx" style={{ borderRadius: "var(--radius)" }}>
                <div className="relative aspect-[16/10] bg-graphite">
                  {c.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <BrandMark slug={c.make.toLowerCase().replace(/[^a-z0-9]+/g, "-")} name={c.make} className="h-16 w-16 text-[4rem] text-white/20" />
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur ${c.isPublic ? "bg-emerald-400/20 text-emerald-200" : "bg-black/50 text-mist"}`}>{c.isPublic ? "Public" : "Private"}</span>
                  {c.images.length > 1 && <span className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 text-[10px]">+{c.images.length - 1} photos</span>}
                </div>
                <div className="p-5">
                  <p className="eyebrow">{c.make} · {c.year}</p>
                  <h3 className="mt-1 font-display text-2xl leading-tight">{c.model}</h3>
                  <p className="mt-2 text-xs text-mist">
                    {[c.color, c.mileageKm != null && `${c.mileageKm.toLocaleString()} km`, c.acquiredYear && `owned since ${c.acquiredYear}`].filter(Boolean).join(" · ") || "No details yet"}
                  </p>
                  {c.estValueUsd != null && <p className="mt-3 font-display text-2xl text-gilded">{formatPrice(c.estValueUsd)}</p>}
                  {c.notes && <p className="mt-2 line-clamp-2 text-sm text-ivory/70">{c.notes}</p>}
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-white/[0.06] pt-4 text-[11px] uppercase tracking-[0.15em]">
                    <button onClick={() => { setEditing(c.id); setAdding(false); }} className="text-gold hover:text-gold-soft">Edit</button>
                    <button disabled={pending} onClick={() => run(() => setGaragePublic(c.id, !c.isPublic))} className="text-mist hover:text-ivory">{c.isPublic ? "Make private" : "Make public"}</button>
                    {c.catalog && <Link href={`/cars/${c.catalog.slug}`} className="text-mist hover:text-ivory">In showroom</Link>}
                    <button disabled={pending} onClick={() => confirm(`Remove ${c.make} ${c.model} from your garage?`) && run(() => deleteGarageCar(c.id))} className="ml-auto text-red-300/80 hover:text-red-300">Delete</button>
                  </div>
                </div>
              </motion.article>
            ),
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
