"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCar } from "../actions";

export interface CarFormValues {
  id?: string;
  brandId?: string;
  model?: string;
  slug?: string;
  year?: number;
  tagline?: string;
  description?: string;
  bodyType?: string;
  priceFrom?: number;
  engine?: string;
  powerHp?: number;
  torqueNm?: number;
  zeroToHundred?: number;
  topSpeedKmh?: number;
  drivetrain?: string;
  transmission?: string;
  seats?: number;
  weightKg?: number | null;
  status?: string;
  featured?: boolean;
  photos?: string;
  sketchfabUid?: string | null;
  sketchfabCredit?: string | null;
  sketchfabPaint?: string | null;
  configuratorUrl?: string | null;
  colors?: string;
  variants?: string;
}

function F({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "md:col-span-2 xl:col-span-3" : ""}`}>
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-mist/80">{hint}</span>}
    </label>
  );
}

export function CarForm({ brands, values = {} }: { brands: { id: string; name: string }[]; values?: CarFormValues }) {
  const [state, action, pending] = useActionState(saveCar, null);
  const v = values;
  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="id" value={v.id ?? ""} />

      <fieldset className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <legend className="eyebrow mb-4">Identity</legend>
        <F label="Brand *">
          <select name="brandId" defaultValue={v.brandId ?? ""} required className="field">
            <option value="" disabled>Choose…</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </F>
        <F label="Model *"><input name="model" defaultValue={v.model} required className="field" /></F>
        <F label="Year *"><input name="year" type="number" defaultValue={v.year ?? new Date().getFullYear()} required className="field" /></F>
        <F label="URL slug" hint="Leave blank to generate from brand + model"><input name="slug" defaultValue={v.slug} className="field" /></F>
        <F label="Body type">
          <select name="bodyType" defaultValue={v.bodyType ?? "GT"} className="field">
            <option value="HYPER">Hypercar</option><option value="GT">Grand Tourer</option><option value="SEDAN">Saloon</option><option value="SUV">SUV</option>
          </select>
        </F>
        <F label="Status">
          <select name="status" defaultValue={v.status ?? "AVAILABLE"} className="field">
            {["AVAILABLE", "RESERVED", "SOLD", "AUCTION", "COMING_SOON"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </F>
        <F label="Tagline" wide><input name="tagline" defaultValue={v.tagline} className="field" /></F>
        <F label="Description" wide><textarea name="description" rows={4} defaultValue={v.description} className="field" /></F>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="featured" defaultChecked={v.featured} className="h-4 w-4 accent-[var(--accent)]" /> Featured on home page</label>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <legend className="eyebrow mb-4">Price & specification</legend>
        <F label="Price from (USD) *"><input name="priceFrom" type="number" defaultValue={v.priceFrom} required className="field" /></F>
        <F label="Engine"><input name="engine" defaultValue={v.engine} className="field" /></F>
        <F label="Power (hp) *"><input name="powerHp" type="number" defaultValue={v.powerHp} required className="field" /></F>
        <F label="Torque (Nm) *"><input name="torqueNm" type="number" defaultValue={v.torqueNm} required className="field" /></F>
        <F label="0–100 km/h (s) *"><input name="zeroToHundred" type="number" step="0.01" defaultValue={v.zeroToHundred} required className="field" /></F>
        <F label="Top speed (km/h) *"><input name="topSpeedKmh" type="number" defaultValue={v.topSpeedKmh} required className="field" /></F>
        <F label="Drivetrain"><input name="drivetrain" defaultValue={v.drivetrain} className="field" /></F>
        <F label="Transmission"><input name="transmission" defaultValue={v.transmission} className="field" /></F>
        <F label="Seats *"><input name="seats" type="number" defaultValue={v.seats ?? 2} required className="field" /></F>
        <F label="Weight (kg)"><input name="weightKg" type="number" defaultValue={v.weightKg ?? ""} className="field" /></F>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="eyebrow mb-4">Real-car media</legend>
        <F label="Photos" hint="One per line: https://image-url | credit. The first photo is the banner." wide>
          <textarea name="photos" rows={4} defaultValue={v.photos} className="field font-mono text-xs" placeholder="https://upload.wikimedia.org/... | Photographer · CC BY-SA 4.0" />
        </F>
        <F label="Sketchfab model (360°)" hint="Paste the model URL or its 32-character ID">
          <input name="sketchfabUid" defaultValue={v.sketchfabUid ?? ""} className="field font-mono text-xs" placeholder="https://sketchfab.com/3d-models/...-0123abcd..." />
        </F>
        <F label="360° credit"><input name="sketchfabCredit" defaultValue={v.sketchfabCredit ?? ""} className="field" placeholder="“Model name” by Author on Sketchfab" /></F>
        <F label="360° paint material(s)" hint="Material name(s) the colour picker recolours, comma-separated. Leave blank to auto-detect.">
          <input name="sketchfabPaint" defaultValue={v.sketchfabPaint ?? ""} className="field font-mono text-xs" />
        </F>
        <F label="Official configurator URL" wide><input name="configuratorUrl" type="url" defaultValue={v.configuratorUrl ?? ""} className="field" /></F>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="eyebrow mb-4">Options</legend>
        <F label="Exterior colours" hint="One per line: Name | #hex | GLOSS/METALLIC/MATTE/PEARL | price delta">
          <textarea name="colors" rows={6} defaultValue={v.colors} className="field font-mono text-xs" placeholder="Rosso Corsa | #c0111f | GLOSS | 0" />
        </F>
        <F label="Variants" hint="One per line: Name | price delta | power hp (optional) | note (optional)">
          <textarea name="variants" rows={6} defaultValue={v.variants} className="field font-mono text-xs" placeholder="Spider | 52000 | | Retractable hard top" />
        </F>
      </fieldset>

      {state && !state.ok && <p className="border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300">{state.message}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : v.id ? "Save changes" : "Create listing"}</button>
        <Link href="/admin/cars" className="btn btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
