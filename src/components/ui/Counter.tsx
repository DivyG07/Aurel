"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

/** Counts up to `value` when scrolled into view, and animates from the old value whenever it changes. */
export function Counter({ value, decimals = 0, prefix = "", suffix = "", format }: { value: number; decimals?: number; prefix?: string; suffix?: string; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const shown = useRef(0);
  const render = useRef((n: number) => prefix + (format ? format(n) : n.toFixed(decimals)) + suffix);
  render.current = (n: number) => prefix + (format ? format(n) : n.toFixed(decimals)) + suffix;

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const controls = animate(shown.current, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        shown.current = n;
        el.textContent = render.current(n);
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>{render.current(0)}</span>;
}
