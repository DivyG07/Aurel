"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COOKIE, themeFor, themeVars } from "@/lib/themes";

/** Landing directly on a brand page (shared link, bookmark) still enters that brand's world. */
export function EnterWorld({ slug, accentHex, name }: { slug: string; accentHex: string; name: string }) {
  const router = useRouter();
  useEffect(() => {
    if (document.documentElement.dataset.brand === slug) return;
    const theme = themeFor(slug, accentHex, name);
    document.cookie = `${COOKIE}=${slug}; path=/; max-age=31536000; samesite=lax`;
    const root = document.documentElement;
    Object.entries(themeVars(theme)).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.brand = theme.slug;
    router.refresh();
  }, [slug, accentHex, name, router]);
  return null;
}
