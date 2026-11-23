"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MAX_COMPARE, toast, useCompare, type CompareItem } from "@/lib/stores";

/** Floating bar listing cars queued for comparison. */
export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const show = mounted && items.length > 0 && !pathname.startsWith("/compare") && !pathname.startsWith("/admin");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-4 left-1/2 z-[45] flex w-[min(96vw,760px)] -translate-x-1/2 items-center gap-3 border border-white/10 bg-onyx/95 p-3 shadow-2xl backdrop-blur-xl"
          style={{ borderRadius: "var(--radius)" }}
        >
          <p className="hidden pl-2 text-[10px] uppercase tracking-[0.25em] text-gold sm:block">Compare</p>
          <div className="flex flex-1 gap-2">
            {Array.from({ length: MAX_COMPARE }, (_, i) => items[i]).map((it, i) =>
              it ? (
                <div key={it.slug} className="group relative h-14 flex-1 overflow-hidden bg-graphite">
                  {it.image && <Image src={it.image} alt="" fill sizes="200px" className="object-cover opacity-70" />}
                  <p className="absolute bottom-1 left-2 right-6 truncate text-[11px] font-medium drop-shadow">{it.name}</p>
                  <button onClick={() => remove(it.slug)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-xs" aria-label={`Remove ${it.name}`}>
                    ×
                  </button>
                </div>
              ) : (
                <div key={i} className="grid h-14 flex-1 place-items-center border border-dashed border-white/15 text-[10px] uppercase tracking-[0.2em] text-mist">
                  Add car
                </div>
              ),
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Link href={`/compare?cars=${items.map((i) => i.slug).join(",")}`} className={`btn btn-primary !px-4 !py-2.5 ${items.length < 2 ? "pointer-events-none opacity-40" : ""}`}>
              Compare
            </Link>
            <button onClick={clear} className="text-[10px] uppercase tracking-[0.2em] text-mist hover:text-ivory">
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CompareButton({ item, variant = "icon" }: { item: CompareItem; variant?: "icon" | "full" }) {
  const toggle = useCompare((s) => s.toggle);
  const active = useCompare((s) => s.items.some((i) => i.slug === item.slug));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const on = mounted && active;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const r = toggle(item);
        if (r === "full") toast(`You can compare up to ${MAX_COMPARE} cars. Remove one first.`, "error");
        else toast(r === "added" ? `${item.name} added to compare` : `${item.name} removed from compare`, r === "added" ? "success" : "info");
      }}
      aria-pressed={on}
      title={on ? "Remove from compare" : "Add to compare"}
      className={variant === "icon" ? `grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition ${on ? "border-gold bg-gold text-ink" : "border-white/20 bg-black/40 text-ivory hover:border-gold hover:text-gold"}` : `btn ${on ? "btn-primary" : "btn-ghost"}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M8 3v18M16 3v18M3 8h5M16 16h5" />
      </svg>
      {variant === "full" && (on ? "In compare" : "Compare")}
    </button>
  );
}
