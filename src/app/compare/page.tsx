import type { Metadata } from "next";
import { getCars } from "@/lib/cars";
import { CompareClient } from "@/components/compare/CompareClient";

export const metadata: Metadata = { title: "Compare" };
export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ cars?: string }> }) {
  const [cars, sp] = await Promise.all([getCars(), searchParams]);
  const initial = (sp.cars ?? "").split(",").filter((s) => cars.some((c) => c.slug === s)).slice(0, 3);
  return (
    <div className="mx-auto max-w-[1480px] px-5 pb-28 pt-36 md:px-10">
      <p className="eyebrow">Side by side</p>
      <h1 className="mt-4 font-display text-6xl leading-none md:text-8xl">Compare</h1>
      <p className="mt-4 max-w-xl text-mist">Choose up to three cars. Switch variants and colours on each, and the best figure in every row lights up.</p>
      <CompareClient cars={cars} initial={initial} />
    </div>
  );
}
