import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CatalogClient } from "@/components/catalog/CatalogClient";
import { getCars } from "@/lib/cars";
import { COOKIE } from "@/lib/themes";

export const metadata: Metadata = { title: "The Collection" };
export const dynamic = "force-dynamic";

export default async function CarsPage({ searchParams }: { searchParams: Promise<{ brand?: string; q?: string }> }) {
  const [cars, sp, jar] = await Promise.all([getCars(), searchParams, cookies()]);
  const world = jar.get(COOKIE)?.value ?? null;
  const initialBrand = sp.brand === "all" ? null : (sp.brand ?? (cars.some((c) => c.brand.slug === world) ? world : null));
  return (
    <div className="mx-auto max-w-[1480px] px-5 pb-28 pt-36 md:px-10">
      <p className="eyebrow">The Collection</p>
      <h1 className="mt-4 font-display text-6xl leading-none md:text-8xl">
        Every icon, <span className="text-gilded">one room.</span>
      </h1>
      <CatalogClient cars={cars} initialBrand={initialBrand} initialQuery={sp.q ?? ""} />
    </div>
  );
}
