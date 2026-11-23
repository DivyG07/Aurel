"use client";

import { useActionState } from "react";
import { requestViewing } from "@/app/actions";

export function ConciergeForm({ cars, preselect }: { cars: { slug: string; label: string }[]; preselect?: string }) {
  const [state, action, pending] = useActionState(requestViewing, null);
  if (state?.ok) {
    return (
      <div className="grid place-items-center border border-white/[0.07] bg-onyx p-12 text-center" style={{ borderRadius: "var(--radius)" }}>
        <div>
          <p className="font-display text-4xl text-gilded">Thank you</p>
          <p className="mt-3 text-mist">{state.message}</p>
        </div>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-3 border border-white/[0.07] bg-onyx p-8" style={{ borderRadius: "var(--radius)" }}>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="type" defaultValue="GENERAL" className="field">
          <option value="GENERAL">General enquiry</option>
          <option value="VIEWING">Private viewing</option>
          <option value="TEST_DRIVE">Test drive</option>
          <option value="PURCHASE">Purchase</option>
          <option value="TRADE_IN">Trade-in valuation</option>
          <option value="FINANCE">Finance & leasing</option>
        </select>
        <select name="slug" defaultValue={preselect ?? ""} className="field">
          <option value="">Any car / sourcing</option>
          {cars.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
      </div>
      <input name="name" required placeholder="Full name" autoComplete="name" className="field" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="field" />
        <input name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" className="field" />
      </div>
      <textarea name="message" rows={6} placeholder="How can we help?" className="field" />
      {state && !state.ok && <p className="text-sm text-red-300">{state.message}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "Sending…" : "Send to concierge"}</button>
    </form>
  );
}
