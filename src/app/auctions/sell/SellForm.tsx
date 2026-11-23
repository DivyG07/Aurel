"use client";

import { useActionState, useEffect, useState } from "react";
import { createListing, updateListing } from "../actions";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { conditionLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/stores";

type Initial = {
  id: string;
  title: string;
  make: string;
  model: string;
  year?: number;
  mileageKm?: number;
  condition: string;
  listingType: string;
  location: string;
  description: string;
  startingBid: number;
  reservePrice?: number;
  durationDays: number;
  startsAt: string;
  images: { id: string; url: string }[];
};

const L = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-mist/80">{hint}</span>}
  </label>
);

export function SellForm({ brands, defaultType, initial }: { brands: string[]; defaultType: "DEALER" | "COLLECTOR"; initial?: Initial }) {
  const editing = !!initial;
  const [state, action, pending] = useActionState(editing ? updateListing : createListing, null);
  const [type, setType] = useState(initial?.listingType === "DEALER" ? "DEALER" : initial ? "COLLECTOR" : defaultType);
  const [start, setStart] = useState(initial?.startingBid ?? 0);
  const [keep, setKeep] = useState((initial?.images ?? []).map((i) => i.id));

  useEffect(() => {
    if (state?.ok) toast(state.message, "success");
  }, [state]);

  return (
    <form action={action} className="mt-10 space-y-8">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="listingType" value={type} />
      {keep.map((k) => <input key={k} type="hidden" name="keep" value={k} />)}

      <fieldset>
        <legend className="eyebrow mb-4">I am selling as</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["DEALER", "Dealer", "First-hand — new or delivery-mileage cars from my dealership"],
            ["COLLECTOR", "Collector", "Second-hand — a car from my own collection"],
          ] as const).map(([k, t, d]) => (
            <button key={k} type="button" onClick={() => setType(k)} className={`border p-5 text-left transition ${type === k ? "border-gold bg-gold/[0.07]" : "border-white/10 hover:border-white/30"}`} style={{ borderRadius: "var(--radius)" }}>
              <p className="font-display text-2xl">{t}</p>
              <p className="mt-1 text-sm text-mist">{d}</p>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="eyebrow mb-4">The car</legend>
        <L label="Make *">
          <input name="make" list="makes" defaultValue={initial?.make} required className="field" placeholder="e.g. Ferrari" />
          <datalist id="makes">{brands.map((b) => <option key={b} value={b} />)}</datalist>
        </L>
        <L label="Model *"><input name="model" defaultValue={initial?.model} required className="field" placeholder="e.g. 812 Superfast" /></L>
        <L label="Year *"><input name="year" type="number" defaultValue={initial?.year} required min={1900} max={new Date().getFullYear() + 1} className="field" /></L>
        <L label="Mileage (km) *"><input name="mileageKm" type="number" defaultValue={initial?.mileageKm ?? (type === "DEALER" ? 0 : undefined)} required min={0} className="field" /></L>
        <L label="Condition *">
          <select name="condition" defaultValue={initial?.condition || (type === "DEALER" ? "NEW" : "")} required className="field">
            <option value="" disabled>Choose…</option>
            {Object.entries(conditionLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </L>
        <L label="Location"><input name="location" defaultValue={initial?.location} className="field" placeholder="City, country" /></L>
        <div className="sm:col-span-2">
          <L label="Lot title" hint="Leave blank to use “Year Make Model”."><input name="title" defaultValue={initial?.title} maxLength={120} className="field" placeholder="e.g. 2019 Ferrari 812 Superfast — one owner, full Ferrari history" /></L>
        </div>
        <div className="sm:col-span-2">
          <L label="Description" hint="History, options, service records, known issues. Honesty sells.">
            <textarea name="description" defaultValue={initial?.description} rows={6} maxLength={4000} className="field leading-relaxed" />
          </L>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-4">Photos * (1–6)</legend>
        {keep.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(initial?.images ?? []).filter((i) => keep.includes(i.id)).map((i) => (
              <div key={i.id} className="relative h-20 w-28 overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== i.id))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs" aria-label="Remove image">×</button>
              </div>
            ))}
          </div>
        )}
        <ImagePicker name="images" max={Math.max(0, 6 - keep.length)} label="Photos" />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="eyebrow mb-4">Auction terms</legend>
        <L label="Starting bid (USD) *" hint={start ? `Bids go up in steps of ${formatPrice(Math.max(500, Math.round((start * 0.01) / 500) * 500))}` : undefined}>
          <input name="startingBid" type="number" defaultValue={initial?.startingBid} onChange={(e) => setStart(Number(e.target.value))} required min={1000} step={500} className="field" />
        </L>
        <L label="Reserve price (optional)" hint="Hidden from bidders. The car won't sell below it.">
          <input name="reservePrice" type="number" defaultValue={initial?.reservePrice} min={1000} step={500} className="field" />
        </L>
        <L label="Auction length">
          <select name="durationDays" defaultValue={initial?.durationDays && [1, 3, 5, 7].includes(initial.durationDays) ? initial.durationDays : 3} className="field">
            {[1, 3, 5, 7].map((d) => <option key={d} value={d}>{d} {d === 1 ? "day" : "days"}</option>)}
          </select>
        </L>
        <div>
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Bidding opens</span>
          <p className="border border-white/10 px-4 py-3 text-sm text-mist" style={{ borderRadius: "var(--radius)" }}>Live the moment our team approves your listing.</p>
        </div>
      </fieldset>

      {state && !state.ok && <p className="border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300">{state.message}</p>}
      {state?.ok && <p className="border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold">{state.message}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="btn btn-primary">{pending ? "Submitting…" : editing ? "Save & resubmit" : "Submit for review"}</button>
        <p className="text-xs text-mist">By submitting you confirm you own the car or are authorised to sell it.</p>
      </div>
    </form>
  );
}
