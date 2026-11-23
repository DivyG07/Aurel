"use client";

import { AnimatePresence, motion } from "motion/react";
import { useToasts } from "@/lib/stores";

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[75] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`pointer-events-auto border-l-2 bg-onyx/95 px-4 py-3 text-left text-sm shadow-2xl backdrop-blur ${t.tone === "error" ? "border-red-400" : t.tone === "success" ? "border-gold" : "border-white/40"}`}
          >
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
