import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getMyGarage } from "@/lib/garage";
import { GarageClient } from "./GarageClient";

export const metadata: Metadata = { title: "My Garage" };
export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const user = await requireUser("/garage");
  const [cars, catalog, brands] = await Promise.all([
    getMyGarage(user.id),
    db.car.findMany({ select: { slug: true, model: true, year: true, brand: { select: { name: true, slug: true } } }, orderBy: [{ brand: { name: "asc" } }, { model: "asc" }] }),
    db.brand.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-[1300px] px-5 pb-28 pt-32 md:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">My Garage</p>
          <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">Your collection</h1>
          <p className="mt-4 max-w-xl text-mist">Keep a record of the cars you own — photos, mileage, what they&apos;re worth. Make any of them public to show them off in Collectors&apos; Garages.</p>
        </div>
        <Link href="/garages" className="btn btn-ghost">Browse Collectors&apos; Garages →</Link>
      </div>
      <GarageClient
        cars={cars}
        catalog={catalog.map((c) => ({ slug: c.slug, model: c.model, year: c.year, brand: c.brand.name, brandSlug: c.brand.slug }))}
        makes={brands.map((b) => b.name)}
      />
    </div>
  );
}
