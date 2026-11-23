"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { Turnstile } from "@/components/auth/Turnstile";
import { register, verifyHuman } from "../actions";

type Mode = "signin" | "signup";

export function LoginForm({ next, googleEnabled, initialError }: { next: string; googleEnabled: boolean; initialError: string | null }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const [accountType, setAccountType] = useState<"COLLECTOR" | "DEALER">("COLLECTOR");

  const fail = (msg: string) => {
    setError(msg);
    setBusy(null);
    setResetKey((k) => k + 1); // Turnstile tokens are single-use
  };

  async function credentialsSignIn(email: string, password: string) {
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      const code = (res as { code?: string } | undefined)?.code;
      return fail(code === "captcha" ? "Security check expired. Please try again." : code === "banned" ? "This account has been suspended." : "Incorrect email or password.");
    }
    // Full navigation so every server component (header, account menu) renders with the new session.
    window.location.assign(next);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!token) return setError("Please complete the security check first.");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy("form");
    if (mode === "signup") {
      const r = await register({ name: String(f.get("name") ?? ""), email, password, token, accountType });
      if (!r.ok) return fail(r.message);
    } else {
      const r = await verifyHuman(token);
      if (!r.ok) return fail("Security check failed. Please try again.");
    }
    await credentialsSignIn(email, password);
  }

  async function onGoogle() {
    setError(null);
    if (!token) return setError("Please complete the security check first.");
    setBusy("google");
    const r = await verifyHuman(token);
    if (!r.ok) return fail("Security check failed. Please try again.");
    await signIn("google", { redirectTo: next });
  }

  return (
    <div className="w-full max-w-md">
      <p className="eyebrow">Private access</p>
      <h1 className="mt-3 font-display text-5xl">{mode === "signin" ? "Welcome back" : "Join the list"}</h1>

      <div className="mt-8 grid grid-cols-2 border-b border-white/10">
        {(["signin", "signup"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(null); }} className={`relative pb-3 text-[11px] uppercase tracking-[0.25em] transition ${mode === m ? "text-ivory" : "text-mist hover:text-ivory"}`}>
            {m === "signin" ? "Sign in" : "Create account"}
            {mode === m && <motion.span layoutId="tab" className="absolute inset-x-0 -bottom-px h-px bg-gold" />}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-3">
        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mb-3 grid grid-cols-2 gap-2">
                {([
                  ["COLLECTOR", "Collector", "I buy & collect"],
                  ["DEALER", "Dealer", "I sell professionally"],
                ] as const).map(([k, t, d]) => (
                  <button key={k} type="button" onClick={() => setAccountType(k)} className={`border px-4 py-3 text-left transition ${accountType === k ? "border-gold bg-gold/[0.08]" : "border-white/15 hover:border-white/30"}`} style={{ borderRadius: "var(--radius)" }}>
                    <span className="block text-sm">{t}</span>
                    <span className="block text-[11px] text-mist">{d}</span>
                  </button>
                ))}
              </div>
              <input name="name" required placeholder="Full name" autoComplete="name" className="field" />
            </motion.div>
          )}
        </AnimatePresence>
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="field" />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" autoComplete={mode === "signin" ? "current-password" : "new-password"} className="field" />

        <div className="pt-1">
          <Turnstile onToken={setToken} resetKey={resetKey} />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button disabled={busy !== null} className="btn btn-primary w-full">
          {busy === "form" ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-mist">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>

      <button onClick={onGoogle} disabled={busy !== null || !googleEnabled} className="btn btn-ghost w-full !normal-case !tracking-normal !text-sm !font-medium">
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {busy === "google" ? "Redirecting…" : "Continue with Google"}
      </button>
      {!googleEnabled && <p className="mt-2 text-center text-[11px] text-mist">Google sign-in activates once AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set.</p>}
      <p className="mt-8 text-center text-[11px] leading-relaxed text-mist">Protected by Cloudflare Turnstile. Every sign-in is logged for account security.</p>
    </div>
  );
}
