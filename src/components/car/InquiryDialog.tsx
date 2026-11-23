"use client";

import { useActionState, useEffect } from "react";
import { motion } from "motion/react";
import { requestViewing } from "@/app/actions";
import type { CarView } from "@/lib/types";

const field = "w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none transition placeholder:text-mist focus:border-gold";

export function InquiryDialog({ car, summary, onClose }: { car: CarView; summary: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(requestViewing, null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[65] grid place-items-center bg-ink/80 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-lenis-prevent
    >
      <motion.div
        role="dialog"
        aria-modal
        aria-labelledby="inq-title"
        className="max-h-[90svh] w-full max-w-lg overflow-y-auto border border-white/10 bg-onyx p-8"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Private viewing</p>
            <h2 id="inq-title" className="mt-2 font-display text-4xl">
              {car.brand.name} {car.model}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-2xl text-mist hover:text-ivory">×</button>
        </div>
        <p className="mt-3 text-xs text-mist">{summary}</p>

        {state?.ok ? (
          <div className="py-10 text-center">
            <p className="font-display text-3xl text-gilded">Request received</p>
            <p className="mt-3 text-sm text-mist">{state.message}</p>
            <button onClick={onClose} className="mt-8 border border-white/15 px-6 py-3 text-[10px] uppercase tracking-[0.25em] hover:border-gold hover:text-gold">
              Return to showroom
            </button>
          </div>
        ) : (
          <form action={action} className="mt-7 space-y-3">
            <input type="hidden" name="slug" value={car.slug} />
            <input type="hidden" name="config" value={summary} />
            <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <select name="type" className={`${field} bg-onyx`} defaultValue="VIEWING">
              <option value="VIEWING">Private viewing</option>
              <option value="TEST_DRIVE">Test drive</option>
              <option value="PURCHASE">Purchase enquiry</option>
            </select>
            <input name="name" required placeholder="Full name" className={field} autoComplete="name" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="email" type="email" required placeholder="Email" className={field} autoComplete="email" />
              <input name="phone" type="tel" placeholder="Phone (optional)" className={field} autoComplete="tel" />
            </div>
            <textarea name="message" rows={3} placeholder="Preferred dates, location, questions…" className={field} />
            {state && !state.ok && <p className="text-sm text-red-300">{state.message}</p>}
            <button disabled={pending} className="w-full bg-gold py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink transition hover:bg-gold-soft disabled:opacity-60">
              {pending ? "Sending…" : "Send request"}
            </button>
            <p className="text-center text-[10px] text-mist">Your details are only shared with your assigned advisor.</p>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
