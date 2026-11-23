import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHead } from "../../ui";
import { CarForm } from "../CarForm";

export default async function EditCar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [car, brands] = await Promise.all([
    db.car.findUnique({
      where: { id },
      include: { colors: { where: { kind: "EXTERIOR" }, orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } }, media: { where: { type: "IMAGE" }, orderBy: { sortOrder: "asc" } } },
    }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!car) notFound();

  const photos = car.media.length ? car.media.map((m) => [m.url, m.credit].filter(Boolean).join(" | ")) : car.heroImage ? [[car.heroImage, car.heroCredit].filter(Boolean).join(" | ")] : [];
  return (
    <>
      <PageHead title={`Edit ${car.model}`} />
      <CarForm
        brands={brands}
        values={{
          ...car,
          photos: photos.join("\n"),
          colors: car.colors.map((c) => `${c.name} | ${c.hex} | ${c.finish} | ${c.priceDelta}`).join("\n"),
          variants: car.variants.map((v) => [v.name, v.priceDelta, v.powerHp ?? "", v.note ?? ""].join(" | ")).join("\n"),
        }}
      />
    </>
  );
}
