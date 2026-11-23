import { db } from "@/lib/db";
import { themes } from "@/lib/themes";
import { deleteBrand } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
import { Notice, PageHead } from "../ui";
import { BrandForm } from "./BrandForm";

export default async function AdminBrands({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const brands = await db.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { cars: true } } } });
  return (
    <>
      <PageHead title="Brands" sub="Each brand has its own world. Built-in presets exist for the launch marques; new brands get a theme from their accent colour." />
      <Notice error={sp.error} />
      <div className="mb-10 border border-white/[0.07] bg-onyx p-6">
        <p className="eyebrow mb-4">Add a brand</p>
        <BrandForm />
      </div>
      <div className="space-y-3">
        {brands.map((b) => (
          <details key={b.id} className="group border border-white/[0.07] bg-onyx">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
              <span className="flex items-center gap-4">
                <span className="h-6 w-6 rounded-full border border-white/20" style={{ background: themes[b.slug]?.accent ?? b.accentHex }} />
                <span className="font-display text-2xl">{b.name}</span>
                <span className="text-xs text-mist">{b.country} · {b._count.cars} cars {themes[b.slug] ? "· custom theme" : ""}</span>
              </span>
              <span className="text-xs text-gold group-open:hidden">Edit</span>
            </summary>
            <div className="border-t border-white/[0.07] p-5">
              <BrandForm brand={b} />
              <div className="mt-4"><ConfirmButton action={deleteBrand} id={b.id} label="Delete brand" confirm={`Delete ${b.name}?`} /></div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
