import "server-only";
import { db } from "./db";

const makeToBrand: Record<string, string> = {
  ferrari: "ferrari",
  lamborghini: "lamborghini",
  bugatti: "bugatti",
  "rolls-royce": "rolls-royce",
  bentley: "bentley",
  "aston martin": "aston-martin",
  mclaren: "mclaren",
  porsche: "porsche",
  maybach: "maybach",
  "mercedes-maybach": "maybach",
  byd: "byd",
  yangwang: "byd",
};
export const brandSlugForMake = (make: string) => makeToBrand[make.trim().toLowerCase()] ?? null;

export interface IconCar {
  id: string;
  make: string;
  model: string;
  year: number | null;
  story: string | null;
  sourceUrl: string;
  sourceName: string | null;
  brandSlug: string | null;
  catalog: { slug: string; model: string; heroImage: string | null; brand: string } | null;
}
export interface IconView {
  slug: string;
  name: string;
  profession: string;
  country: string | null;
  bio: string | null;
  cars: IconCar[];
  cover: string | null; // photo of one of their cars we stock
}

const include = { cars: { orderBy: { sortOrder: "asc" as const }, include: { car: { include: { brand: true } } } } };
type Row = NonNullable<Awaited<ReturnType<typeof one>>>;
const one = (slug: string) => db.celebrity.findUnique({ where: { slug }, include });

function toView(p: Row): IconView {
  const cars = p.cars.map((c) => ({
    id: c.id,
    make: c.make,
    model: c.model,
    year: c.year,
    story: c.story,
    sourceUrl: c.sourceUrl,
    sourceName: c.sourceName,
    brandSlug: brandSlugForMake(c.make),
    catalog: c.car ? { slug: c.car.slug, model: c.car.model, heroImage: c.car.heroImage, brand: c.car.brand.name } : null,
  }));
  return { slug: p.slug, name: p.name, profession: p.profession, country: p.country, bio: p.bio, cars, cover: cars.find((c) => c.catalog?.heroImage)?.catalog?.heroImage ?? null };
}

export async function getIcons() {
  const rows = await db.celebrity.findMany({ include, orderBy: { name: "asc" } });
  return rows.map(toView);
}

export async function getIcon(slug: string) {
  const row = await one(slug);
  return row ? toView(row) : null;
}

/** Famous owners of a catalog car (exact model match). */
export async function getOwnersOfCar(carId: string) {
  const rows = await db.celebrityCar.findMany({ where: { carId }, include: { celebrity: true } });
  return rows.map((r) => ({ slug: r.celebrity.slug, name: r.celebrity.name, profession: r.celebrity.profession, model: r.model, story: r.story, sourceUrl: r.sourceUrl, sourceName: r.sourceName }));
}
