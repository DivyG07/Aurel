"use client";

import { useCallback } from "react";
import { COOKIE, themeFor } from "@/lib/themes";
import { useCurtain } from "@/lib/stores";

const SWAP_AT = 1500; // ms into the loading screen before we navigate underneath it
export const TRANSITION_COOKIE = "aurel-transition";

/**
 * Enter or leave a brand world. The loading screen plays, then we do a full page load to the
 * destination with the new cookie. A full load (not client-side routing) guarantees the server
 * renders the right theme every time — client router caches could otherwise replay a stale
 * "redirect into the world" and make leaving fail on the first try. A short-lived transition
 * cookie lets the next page start covered and fade in, so there's no flash between pages.
 */
export function useBrandWorld() {
  const show = useCurtain((s) => s.show);

  const apply = useCallback(
    (slug: string | null, accentHex?: string, name?: string, go?: string) => {
      const theme = themeFor(slug, accentHex, name);
      show({ slug, label: slug ? theme.name : "AUREL", motto: theme.motto, color: theme.accent });
      setTimeout(() => {
        document.cookie = slug ? `${COOKIE}=${slug}; path=/; max-age=31536000; samesite=lax` : `${COOKIE}=; path=/; max-age=0; samesite=lax`;
        document.cookie = `${TRANSITION_COOKIE}=${encodeURIComponent(slug ? theme.name : "AUREL")}; path=/; max-age=10; samesite=lax`;
        const target = go ?? window.location.pathname + window.location.search;
        window.location.assign(target);
      }, SWAP_AT);
    },
    [show],
  );

  return {
    enter: (slug: string, accentHex?: string, name?: string) => apply(slug, accentHex, name, `/brands/${slug}`),
    exit: (go?: string) => apply(null, undefined, undefined, go ?? "/"),
  };
}
