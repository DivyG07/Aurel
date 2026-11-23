"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCompare } from "@/lib/stores";

/**
 * AUREL Concierge — our own themed launcher + panel around the Zapier chatbot (iframe embed),
 * instead of Zapier's default blue bubble. The iframe loads only after the first open.
 * Configure with NEXT_PUBLIC_ZAPIER_CHATBOT_ID.
 */
export function ZapierChatbot() {
  const id = process.env.NEXT_PUBLIC_ZAPIER_CHATBOT_ID;
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const compareOpen = useCompare((s) => s.items.length > 0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!id || !/^[\w-]+$/.test(id) || pathname.startsWith("/admin")) return null;
  // Lift above the compare tray when it's showing.
  const lift = mounted && compareOpen && !pathname.startsWith("/compare") ? "bottom-28" : "bottom-6";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="AUREL Concierge chat"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-x-0 bottom-0 z-[60] flex h-[85svh] flex-col overflow-hidden border border-white/10 bg-onyx/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:h-[600px] sm:max-h-[calc(100svh-220px)] sm:w-[400px] ${lift === "bottom-28" ? "sm:bottom-44" : "sm:bottom-24"}`}
            style={{ borderRadius: "max(var(--radius), 14px)" }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="relative grid h-9 w-9 place-items-center rounded-full border border-gold/50 bg-gold/10 text-gold">
                  <ChatIcon />
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-onyx bg-emerald-400" />
                </span>
                <div>
                  <p className="font-display text-xl leading-none">Concierge</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-mist">Ask about any car or auction</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-mist transition hover:bg-white/5 hover:text-ivory" aria-label="Close chat">
                ×
              </button>
            </div>
            <div className="relative flex-1 bg-white">
              {!ready && (
                <div className="absolute inset-0 grid place-items-center bg-onyx">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border border-white/10 border-t-gold" />
                    <p className="text-[10px] uppercase tracking-[0.25em] text-mist">Connecting to the concierge</p>
                  </div>
                </div>
              )}
              {loaded && (
                <iframe
                  title="AUREL Concierge"
                  src={`https://interfaces.zapier.com/embed/chatbot/${id}`}
                  className="h-full w-full border-0"
                  allow="clipboard-write *"
                  onLoad={() => setTimeout(() => setReady(true), 1200)}
                />
              )}
            </div>
            <p className="border-t border-white/[0.08] px-5 py-2 text-center text-[10px] text-mist">AI assistant · for bookings, a human advisor follows up</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => {
          setLoaded(true);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={open ? "Close concierge chat" : "Open concierge chat"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className={`group fixed right-6 z-[60] flex items-center gap-2.5 rounded-full border border-gold/40 bg-ink/80 py-2 pl-2 pr-2 text-ivory shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-500 hover:border-gold sm:pr-5 ${lift}`}
      >
        <span className={`grid h-9 w-9 place-items-center rounded-full transition-colors duration-300 ${open ? "bg-gold text-ink" : "bg-gold/15 text-gold group-hover:bg-gold group-hover:text-ink"}`}>
          {open ? <span className="text-lg leading-none">×</span> : <ChatIcon />}
        </span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.25em] sm:inline">{open ? "Close" : "Concierge"}</span>
      </motion.button>
    </>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </svg>
  );
}
