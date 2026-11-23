"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { COOKIE, themeFor, themeVars } from "@/lib/themes";
import { useCurtain } from "@/lib/stores";

const SWAP_AT = 1500; // ms into the loading screen when the theme switches underneath
const HIDE_AT = 3000;

/** Enter or leave a brand world: plays the loading screen, re-skins, re-renders on the server. */
export function useBrandWorld() {
  const router = useRouter();
  const show = useCurtain((s) => s.show);
  const hide = useCurtain((s) => s.hide);

  const apply = useCallback(
    (slug: string | null, accentHex?: string, name?: string, go?: string) => {
      const theme = themeFor(slug, accentHex, name);
      show({ slug, label: slug ? theme.name : "AUREL", motto: theme.motto, color: theme.accent });
      setTimeout(() => {
        document.cookie = slug ? `${COOKIE}=${slug}; path=/; max-age=31536000; samesite=lax` : `${COOKIE}=; path=/; max-age=0; samesite=lax`;
        const root = document.documentElement;
        Object.entries(themeVars(theme)).forEach(([k, v]) => root.style.setProperty(k, v));
        root.dataset.brand = theme.slug;
        window.scrollTo({ top: 0 });
        if (go) router.push(go);
        router.refresh();
      }, SWAP_AT);
      setTimeout(hide, HIDE_AT);
    },
    [router, show, hide],
  );

  return {
    enter: (slug: string, accentHex?: string, name?: string) => apply(slug, accentHex, name, `/brands/${slug}`),
    exit: (go?: string) => apply(null, undefined, undefined, go),
  };
}
