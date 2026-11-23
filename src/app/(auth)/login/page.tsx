import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/auth";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Private Access" };

const errors: Record<string, string> = {
  captcha: "Please complete the security check, then try again.",
  banned: "This account has been suspended. Contact the concierge.",
  unverified: "Your Google email isn't verified.",
  OAuthAccountNotLinked: "This email is already registered with a different sign-in method.",
  Configuration: "Sign-in is temporarily unavailable (server configuration).",
  AccessDenied: "Access denied.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  if (await currentUser()) redirect(next);
  const bg = await db.car.findFirst({ where: { heroImage: { not: null }, featured: true }, orderBy: { priceFrom: "desc" }, select: { heroImage: true, model: true } });

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        {bg?.heroImage && <Image src={bg.heroImage} alt={bg.model} fill priority sizes="55vw" className="animate-kenburns object-cover" />}
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-r from-transparent to-ink" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-sm">
          <p className="eyebrow">Members only</p>
          <p className="mt-3 font-display text-3xl leading-tight">Bid live. Save your garage. Book private viewings.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 pb-16 pt-32">
        <LoginForm next={next} googleEnabled={googleEnabled()} initialError={sp.error ? (errors[sp.error] ?? "Sign-in failed. Please try again.") : null} />
      </div>
    </div>
  );
}
