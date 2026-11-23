"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { saveAuction } from "../actions";

type Values = { id?: string; carId?: string; title?: string; startingBid?: number; reservePrice?: number | null; bidIncrement?: number; antiSnipeSecs?: number; startsAt?: string; endsAt?: string };

// datetime-local works in the admin's local time; we convert to an ISO instant before submit.
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function DateTime({ name, label, initial }: { name: string; label: string; initial?: string }) {
  // Filled after mount: the server doesn't know the admin's timezone.
  const [local, setLocal] = useState("");
  useEffect(() => setLocal(toLocalInput(initial)), [initial]);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">{label} *</span>
      <input type="datetime-local" required value={local} onChange={(e) => setLocal(e.target.value)} className="field [color-scheme:dark]" />
      <input type="hidden" name={name} value={local ? new Date(local).toISOString() : ""} />
    </label>
  );
}

export function AuctionForm({ cars, values = {} }: { cars: { id: string; label: string; price: number }[]; values?: Values }) {
  const [state, action, pending] = useActionState(saveAuction, null);
  const [carId, setCarId] = useState(values.carId ?? "");
  const car = cars.find((c) => c.id === carId);
  // Computed once so re-renders don't reset the date fields.
  const [defaultStart] = useState(() => values.startsAt ?? new Date(Date.now() + 3600_000).toISOString());
  const [defaultEnd] = useState(() => values.endsAt ?? new Date(Date.now() + 25 * 3600_000).toISOString());

  return (
    <form action={action} className="grid max-w-3xl gap-5 md:grid-cols-2">
      <input type="hidden" name="id" value={values.id ?? ""} />
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Car *</span>
        <select name="carId" required value={carId} onChange={(e) => setCarId(e.target.value)} className="field">
          <option value="" disabled>Choose a listing…</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Lot title</span>
        <input name="title" defaultValue={values.title} placeholder={car ? `${car.label} — one owner, full history` : "Auto-generated from the car"} className="field" />
      </label>
      <DateTime name="startsAt" label="Bidding opens" initial={defaultStart} />
      <DateTime name="endsAt" label="Bidding closes" initial={defaultEnd} />
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Starting bid (USD) *</span>
        <input name="startingBid" type="number" required min={1} defaultValue={values.startingBid ?? (car ? Math.round((car.price * 0.8) / 1000) * 1000 : undefined)} key={carId} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Reserve price (optional, hidden)</span>
        <input name="reservePrice" type="number" min={1} defaultValue={values.reservePrice ?? ""} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Bid increment (USD)</span>
        <input name="bidIncrement" type="number" min={1} defaultValue={values.bidIncrement ?? 5000} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Anti-snipe window (seconds)</span>
        <input name="antiSnipeSecs" type="number" min={0} defaultValue={values.antiSnipeSecs ?? 120} className="field" />
      </label>
      <p className="text-xs text-mist md:col-span-2" suppressHydrationWarning>Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). A bid placed inside the anti-snipe window pushes the close back by that many seconds.</p>
      {state && !state.ok && <p className="border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300 md:col-span-2">{state.message}</p>}
      <div className="flex gap-3 md:col-span-2">
        <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : values.id ? "Save auction" : "Schedule auction"}</button>
        <Link href="/admin/auctions" className="btn btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
