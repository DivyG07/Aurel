"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Current time, ticking. Starts at 0 on the server and first client render so SSR output matches. */
export function useNow(offsetMs = 0, interval = 1000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offsetMs), interval);
    setNow(Date.now() + offsetMs);
    return () => clearInterval(t);
  }, [offsetMs, interval]);
  return now;
}

export function splitTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Big flip-style countdown. */
export function Countdown({ to, offsetMs = 0, size = "lg" }: { to: string; offsetMs?: number; size?: "lg" | "sm" }) {
  const now = useNow(offsetMs);
  if (!now) return size === "sm" ? <span className="tabular-nums opacity-40">--:--:--</span> : <div className="h-[88px] md:h-[104px]" />;
  const left = new Date(to).getTime() - now;
  const t = splitTime(left);
  const urgent = left > 0 && left < 5 * 60 * 1000;
  const units = [
    ...(t.d ? [{ k: "d", v: t.d, label: "Days" }] : []),
    { k: "h", v: t.h, label: "Hrs" },
    { k: "m", v: t.m, label: "Min" },
    { k: "s", v: t.s, label: "Sec" },
  ];

  if (size === "sm") {
    return (
      <span className={`tabular-nums ${urgent ? "text-red-400" : ""}`}>
        {t.d ? `${t.d}d ` : ""}
        {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
      </span>
    );
  }

  return (
    <div className={`flex gap-2 ${urgent ? "text-red-400" : ""}`}>
      {units.map((u) => (
        <div key={u.k} className="flex flex-col items-center">
          <div className="relative h-16 w-16 overflow-hidden border border-white/10 bg-graphite md:h-20 md:w-20" style={{ borderRadius: "var(--radius)" }}>
            <AnimatePresence initial={false}>
              <motion.span
                key={u.v}
                className="absolute inset-0 grid place-items-center font-display text-4xl tabular-nums md:text-5xl"
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {pad(u.v)}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="mt-1.5 text-[9px] uppercase tracking-[0.25em] text-mist">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
