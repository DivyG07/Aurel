"use client";

import { useActionState } from "react";
import { syncSheets } from "../actions";

export function SyncButton({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(syncSheets, null);
  return (
    <form action={action}>
      <button disabled={disabled || pending} className="btn btn-primary">{pending ? "Syncing…" : "Sync everything now"}</button>
      {state && <p className={`mt-3 text-sm ${state.ok ? "text-gold" : "text-red-300"}`}>{state.message}</p>}
    </form>
  );
}
