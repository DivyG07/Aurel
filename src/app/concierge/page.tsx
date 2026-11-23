import type { Metadata } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { ConciergeForm } from "./ConciergeForm";

export const metadata: Metadata = { title: "Concierge" };
export const dynamic = "force-dynamic";

export default async function ConciergePage({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const sp = await searchParams;
  const cars = await db.car.findMany({ include: { brand: true }, orderBy: [{ brand: { name: "asc" } }, { model: "asc" }] });
  return (
    <div className="mx-auto grid max-w-[1480px] gap-16 px-5 pb-28 pt-36 md:px-10 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="eyebrow">Concierge</p>
        <h1 className="mt-4 font-display text-6xl leading-none md:text-7xl">At your service, <span className="text-gilded">any hour.</span></h1>
        <p className="mt-6 max-w-md text-mist">Private viewings, test drives, sourcing off-market cars, trade-ins, finance and worldwide delivery. Tell us what you have in mind and a private client advisor will reply within one business day.</p>
        <dl className="mt-12 space-y-6 text-sm">
          <div><dt className="eyebrow">Email</dt><dd className="mt-2">{site.email}</dd></div>
          <div><dt className="eyebrow">Viewings</dt><dd className="mt-2 text-mist">By appointment, seven days a week</dd></div>
          <div><dt className="eyebrow">Delivery</dt><dd className="mt-2 text-mist">Enclosed transport worldwide, door to door</dd></div>
        </dl>
      </div>
      <ConciergeForm cars={cars.map((c) => ({ slug: c.slug, label: `${c.brand.name} ${c.model}` }))} preselect={sp.car} />
    </div>
  );
}
