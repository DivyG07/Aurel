"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/site";

/** Curtain intro shown once per browser session. */
export function IntroLoader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("aurel-intro") === "1";
      sessionStorage.setItem("aurel-intro", "1");
    } catch {}
    if (seen) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2300);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[80] grid place-items-center bg-ink"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="text-center">
            <div className="flex overflow-hidden font-display text-6xl tracking-[0.35em] text-ivory md:text-8xl">
              {site.name.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            <motion.div
              className="hairline mx-auto mt-6"
              initial={{ width: 0 }}
              animate={{ width: 220 }}
              transition={{ delay: 0.7, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.p
              className="eyebrow mt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              {site.tagline}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
