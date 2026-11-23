import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseList } from "@/lib/prefs";
import { OnboardingClient } from "./OnboardingClient";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/onboarding");
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") && !sp.next.startsWith("/onboarding") ? sp.next : "/";
  const [me, brands] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { name: true, role: true, favoriteBrands: true, budget: true, interests: true, carsOwned: true } }),
    db.brand.findMany({ select: { slug: true, name: true, accentHex: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-32 md:px-10">
      <p className="eyebrow">Welcome{me?.name ? `, ${me.name.split(" ")[0]}` : ""}</p>
      <p className="mt-2 text-mist">Four quick questions so we can tailor the showroom to you. You can change these any time in your account.</p>
      <div className="mt-10">
        <OnboardingClient
          next={next}
          isAdmin={user.role === "ADMIN"}
          brands={brands}
          initial={{ accountType: me?.role === "DEALER" ? "DEALER" : "COLLECTOR", brands: parseList(me?.favoriteBrands), budget: me?.budget ?? "", interests: parseList(me?.interests), carsOwned: me?.carsOwned ?? "" }}
        />
      </div>
    </div>
  );
}
