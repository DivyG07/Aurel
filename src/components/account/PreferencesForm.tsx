"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { savePreferences } from "@/app/account/actions";
import { BUDGETS, INTERESTS, OWNED } from "@/lib/prefs";
import { BrandMark } from "@/components/site/BrandMark";
import { toast } from "@/lib/stores";

export interface PrefValues {
  accountType: string;
  brands: string[];
  budget: string;
  interests: string[];
  carsOwned: string;
}
type Brand = { slug: string; name: string; accentHex: string };

const STEPS = ["You are…", "Your top 3 marques", "Budget & collection", "What brings you here"];

/**
 * Four questions. `wizard` shows one step at a time (onboarding); otherwise all at once (account settings).
 */
export function PreferencesForm({ brands, initial, wizard, onSaved, isAdmin }: { brands: Brand[]; initial: PrefValues; wizard?: boolean; onSaved?: () => void; isAdmin?: boolean }) {
  const [state, action, pending] = useActionState(savePreferences, null);
  const [v, setV] = useState(initial);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (state?.ok) {
      toast(state.message, "success");
      onSaved?.();
    } else if (state) toast(state.message, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const toggleBrand = (slug: string) =>
    setV((p) => (p.brands.includes(slug) ? { ...p, brands: p.brands.filter((b) => b !== slug) } : p.brands.length >= 3 ? (toast("Pick up to 3 — remove one first", "info"), p) : { ...p, brands: [...p.brands, slug] }));
  const toggleInterest = (k: string) => setV((p) => ({ ...p, interests: p.interests.includes(k) ? p.interests.filter((x) => x !== k) : [...p.interests, k] }));
  const chip = (on: boolean) => `border px-4 py-3 text-sm text-left transition ${on ? "border-gold bg-gold/[0.08] text-ivory" : "border-white/10 text-ivory/75 hover:border-white/30"}`;

  const sections = [
    <div key="type" className="grid gap-3 sm:grid-cols-2">
      {isAdmin && <p className="text-sm text-mist sm:col-span-2">You&apos;re an administrator — your account type stays “Staff”.</p>}
      {([
        ["COLLECTOR", "Collector", "I buy, own or follow exceptional cars"],
        ["DEALER", "Dealer", "I sell cars professionally"],
      ] as const).map(([k, t, d]) => (
        <button key={k} type="button" disabled={isAdmin} onClick={() => setV((p) => ({ ...p, accountType: k }))} className={`${chip(v.accountType === k)} p-6 disabled:opacity-50`} style={{ borderRadius: "var(--radius)" }}>
          <p className="font-display text-3xl">{t}</p>
          <p className="mt-1 text-sm text-mist">{d}</p>
        </button>
      ))}
    </div>,
    <div key="brands">
      <p className="mb-3 text-xs text-mist">{v.brands.length}/3 selected — we&apos;ll tailor the showroom around them.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {brands.map((b) => {
          const on = v.brands.includes(b.slug);
          return (
            <button key={b.slug} type="button" onClick={() => toggleBrand(b.slug)} className={`${chip(on)} flex items-center gap-3`} style={{ borderRadius: "var(--radius)", ...(on ? { borderColor: b.accentHex } : {}) }}>
              <BrandMark slug={b.slug} name={b.name} color={on ? b.accentHex : "currentColor"} className="h-6 w-6 shrink-0 text-[1.8rem]" />
              <span className="truncate">{b.name}</span>
              {on && <span className="ml-auto text-xs" style={{ color: b.accentHex }}>#{v.brands.indexOf(b.slug) + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>,
    <div key="budget" className="space-y-6">
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-mist">Typical budget for a car</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BUDGETS.map((b) => <button key={b.key} type="button" onClick={() => setV((p) => ({ ...p, budget: b.key }))} className={chip(v.budget === b.key)} style={{ borderRadius: "var(--radius)" }}>{b.label}</button>)}
        </div>
      </div>
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-mist">Cars in your collection today</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OWNED.map((o) => <button key={o.key} type="button" onClick={() => setV((p) => ({ ...p, carsOwned: o.key }))} className={chip(v.carsOwned === o.key)} style={{ borderRadius: "var(--radius)" }}>{o.label}</button>)}
        </div>
      </div>
    </div>,
    <div key="interests" className="grid gap-2 sm:grid-cols-2">
      {INTERESTS.map((i) => (
        <button key={i.key} type="button" onClick={() => toggleInterest(i.key)} className={`${chip(v.interests.includes(i.key))} flex items-center gap-3`} style={{ borderRadius: "var(--radius)" }}>
          <span className="text-xl">{i.icon}</span> {i.label}
          {v.interests.includes(i.key) && <span className="ml-auto text-gold">✓</span>}
        </button>
      ))}
    </div>,
  ];

  const hidden = (
    <>
      <input type="hidden" name="accountType" value={v.accountType} />
      {v.brands.map((b) => <input key={b} type="hidden" name="brands" value={b} />)}
      <input type="hidden" name="budget" value={v.budget} />
      {v.interests.map((i) => <input key={i} type="hidden" name="interests" value={i} />)}
      <input type="hidden" name="carsOwned" value={v.carsOwned} />
    </>
  );

  if (!wizard) {
    return (
      <form action={action} className="space-y-10">
        {hidden}
        {sections.map((s, i) => (
          <div key={i}>
            <p className="eyebrow mb-4">{STEPS[i]}</p>
            {s}
          </div>
        ))}
        <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save preferences"}</button>
      </form>
    );
  }

  return (
    <form action={action}>
      {hidden}
      <div className="mb-8 flex gap-2">
        {STEPS.map((s, i) => <span key={s} className={`h-1 flex-1 transition-colors duration-500 ${i <= step ? "bg-gold" : "bg-white/10"}`} />)}
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Question {step + 1} of {STEPS.length}</p>
      <h2 className="mt-2 font-display text-4xl md:text-5xl">{STEPS[step]}</h2>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="mt-8" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
          {sections[step]}
        </motion.div>
      </AnimatePresence>
      <div className="mt-10 flex items-center justify-between">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className={`btn btn-ghost ${step === 0 ? "invisible" : ""}`}>← Back</button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} className="btn btn-primary">Next →</button>
        ) : (
          <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Enter the showroom"}</button>
        )}
      </div>
    </form>
  );
}
