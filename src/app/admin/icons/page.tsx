import { db } from "@/lib/db";
import { deleteIcon } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
import { PageHead } from "../ui";
import { IconForm } from "./IconForm";

export default async function AdminIcons() {
  const icons = await db.celebrity.findMany({ orderBy: { name: "asc" }, include: { cars: { orderBy: { sortOrder: "asc" }, include: { car: { select: { slug: true } } } } } });
  return (
    <>
      <PageHead title="Icons" sub="Famous owners and their publicly reported cars. Every car needs a source link." />
      <div className="mb-10 border border-white/[0.07] bg-onyx p-6">
        <p className="eyebrow mb-4">Add a person</p>
        <IconForm />
      </div>
      <div className="space-y-3">
        {icons.map((p) => (
          <details key={p.id} className="group border border-white/[0.07] bg-onyx">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
              <span>
                <span className="font-display text-2xl">{p.name}</span>
                <span className="ml-3 text-xs text-mist">{p.profession} · {p.cars.length} cars</span>
              </span>
              <span className="text-xs text-gold group-open:hidden">Edit</span>
            </summary>
            <div className="border-t border-white/[0.07] p-5">
              <IconForm
                icon={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  profession: p.profession,
                  country: p.country ?? "",
                  bio: p.bio ?? "",
                  cars: p.cars.map((c) => [c.make, c.model, c.year ?? "", c.car?.slug ?? "", c.sourceUrl, c.sourceName ?? "", c.story ?? ""].join(" | ")).join("\n"),
                }}
              />
              <div className="mt-4"><ConfirmButton action={deleteIcon} id={p.id} label="Delete person" confirm={`Delete ${p.name}?`} /></div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
