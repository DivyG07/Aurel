"use client";

import { useActionState } from "react";
import { saveBrand } from "../actions";

type Brand = { id: string; name: string; slug: string; country: string; founded: number; tagline: string | null; accentHex: string };

export function BrandForm({ brand }: { brand?: Brand }) {
  const [state, action, pending] = useActionState(saveBrand, null);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <input type="hidden" name="id" value={brand?.id ?? ""} />
      <input name="name" defaultValue={brand?.name} placeholder="Name *" required className="field" />
      <input name="slug" defaultValue={brand?.slug} placeholder="slug (auto)" className="field" />
      <input name="country" defaultValue={brand?.country} placeholder="Country" className="field" />
      <input name="founded" type="number" defaultValue={brand?.founded} placeholder="Founded" className="field" />
      <input name="tagline" defaultValue={brand?.tagline ?? ""} placeholder="Tagline" className="field" />
      <label className="flex items-center gap-2">
        <input name="accentHex" type="color" defaultValue={brand?.accentHex ?? "#c9a96e"} className="h-11 w-14 cursor-pointer border border-white/15 bg-transparent" />
        <button disabled={pending} className="btn btn-primary flex-1 !px-4">{pending ? "…" : brand ? "Save" : "Add"}</button>
      </label>
      {state && <p className={`text-sm md:col-span-3 xl:col-span-6 ${state.ok ? "text-gold" : "text-red-300"}`}>{state.message}</p>}
    </form>
  );
}
