"use client";

import { useActionState } from "react";
import { saveIcon } from "../actions";

type Icon = { id: string; name: string; slug: string; profession: string; country: string; bio: string; cars: string };

export function IconForm({ icon }: { icon?: Icon }) {
  const [state, action, pending] = useActionState(saveIcon, null);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-4">
      <input type="hidden" name="id" value={icon?.id ?? ""} />
      <input name="name" defaultValue={icon?.name} placeholder="Name *" required className="field" />
      <input name="slug" defaultValue={icon?.slug} placeholder="slug (auto)" className="field" />
      <input name="profession" defaultValue={icon?.profession} placeholder="Profession" className="field" />
      <input name="country" defaultValue={icon?.country} placeholder="Country" className="field" />
      <input name="bio" defaultValue={icon?.bio} placeholder="One-line bio" className="field md:col-span-4" />
      <label className="md:col-span-4">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Cars — one per line: Make | Model | Year | catalog slug (optional) | Source URL | Source name | Story</span>
        <textarea name="cars" rows={5} defaultValue={icon?.cars} className="field font-mono text-xs" placeholder="Rolls-Royce | Cullinan | 2019 | rolls-royce-cullinan | https://… | The Drive | Reported to have taken delivery of…" />
      </label>
      <div className="flex items-center gap-4 md:col-span-4">
        <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : icon ? "Save" : "Add person"}</button>
        {state && <p className={`text-sm ${state.ok ? "text-gold" : "text-red-300"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
