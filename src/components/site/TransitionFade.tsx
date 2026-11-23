"use client";

import { useEffect } from "react";

/**
 * Server-rendered cover shown on the first paint after a brand-world switch; fades out with CSS
 * (no JS needed for the animation), then clears its one-shot cookie.
 */
export function TransitionFade({ label }: { label: string }) {
  useEffect(() => {
    document.cookie = "aurel-transition=; path=/; max-age=0; samesite=lax";
  }, []);
  return (
    <div aria-hidden className="world-fade pointer-events-none fixed inset-0 z-[95] grid place-items-center bg-ink">
      <p className="font-display text-5xl text-ivory md:text-7xl">{label}</p>
    </div>
  );
}
