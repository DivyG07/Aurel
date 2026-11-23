"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const EXEMPT = ["/onboarding", "/login", "/api", "/admin"];

/** Sends signed-in members who haven't answered the welcome questions to /onboarding once. */
export function OnboardingGate({ needed }: { needed: boolean }) {
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (needed && !EXEMPT.some((p) => path.startsWith(p))) router.replace(`/onboarding?next=${encodeURIComponent(path)}`);
  }, [needed, path, router]);
  return null;
}
