import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { imageUrl, parseIds } from "@/lib/uploads";
import { SellForm } from "./SellForm";

export const metadata: Metadata = { title: "Sell your car at auction" };
export const dynamic = "force-dynamic";

export default async function SellPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(sp.edit ? `/auctions/sell?edit=${sp.edit}` : "/auctions/sell");
  const brands = await db.brand.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const editing = sp.edit ? await db.auction.findUnique({ where: { id: sp.edit } }) : null;
  if (sp.edit && (!editing || editing.sellerId !== user.id)) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-32 md:px-10">
      <Link href="/auctions" className="text-[11px] uppercase tracking-[0.25em] text-mist hover:text-gold">← Auctions</Link>
      <p className="eyebrow mt-8">{editing ? "Edit your listing" : "Consign your car"}</p>
      <h1 className="mt-3 font-display text-5xl leading-none md:text-6xl">{editing ? editing.title : "Sell at auction"}</h1>
      <p className="mt-4 text-mist">
        Dealers list new cars first-hand; collectors list pre-owned cars. Every submission is reviewed by our team before it goes live — usually within a day.
        {editing?.reviewNote && <span className="mt-3 block border border-gold/30 bg-gold/5 p-3 text-sm text-gold">Reviewer note: {editing.reviewNote}</span>}
      </p>
      <SellForm
        brands={brands.map((b) => b.name)}
        defaultType={user.role === "DEALER" ? "DEALER" : "COLLECTOR"}
        initial={
          editing
            ? {
                id: editing.id,
                title: editing.title,
                make: editing.make ?? "",
                model: editing.model ?? "",
                year: editing.year ?? undefined,
                mileageKm: editing.mileageKm ?? undefined,
                condition: editing.condition ?? "",
                listingType: editing.listingType,
                location: editing.location ?? "",
                description: editing.description ?? "",
                startingBid: editing.startingBid,
                reservePrice: editing.reservePrice ?? undefined,
                durationDays: Math.round((editing.endsAt.getTime() - editing.startsAt.getTime()) / 864e5),
                startsAt: editing.startsAt.toISOString(),
                images: parseIds(editing.imageIds).map((id) => ({ id, url: imageUrl(id) })),
              }
            : undefined
        }
      />
    </div>
  );
}
