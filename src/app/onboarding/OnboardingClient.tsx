"use client";

import { useTransition } from "react";
import { PreferencesForm, type PrefValues } from "@/components/account/PreferencesForm";
import { skipOnboarding } from "@/app/account/actions";

export function OnboardingClient({ next, brands, initial, isAdmin }: { next: string; brands: { slug: string; name: string; accentHex: string }[]; initial: PrefValues; isAdmin: boolean }) {
  const [pending, start] = useTransition();
  // Full navigation so the header and session pick up the saved answers.
  const go = () => window.location.assign(next);
  return (
    <>
      <PreferencesForm wizard brands={brands} initial={initial} isAdmin={isAdmin} onSaved={go} />
      <button disabled={pending} onClick={() => start(async () => { await skipOnboarding(); go(); })} className="mt-8 text-xs uppercase tracking-[0.2em] text-mist hover:text-ivory">
        Skip for now
      </button>
    </>
  );
}
