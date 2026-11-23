import "server-only";
import { db } from "./db";
import type { CarView } from "./types";

const include = {
  brand: true,
  colors: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { sortOrder: "asc" as const } },
  media: { where: { type: "IMAGE" }, orderBy: { sortOrder: "asc" as const } },
  priceHistory: { orderBy: { recordedAt: "asc" as const } },
};

type CarRow = NonNullable<Awaited<ReturnType<typeof findOne>>>;

function findOne(slug: string) {
  return db.car.findUnique({ where: { slug }, include });
}

export function toCarView(c: CarRow): CarView {
  const photos = c.media.map((m) => ({ url: m.url, credit: m.credit }));
  return {
    id: c.id,
    slug: c.slug,
    brand: { slug: c.brand.slug, name: c.brand.name, country: c.brand.country, accentHex: c.brand.accentHex },
    model: c.model,
    year: c.year,
    tagline: c.tagline,
    description: c.description,
    bodyType: c.bodyType as CarView["bodyType"],
    heroImage: c.heroImage ?? photos[0]?.url ?? null,
    heroCredit: c.heroCredit ?? photos[0]?.credit ?? null,
    photos: photos.length ? photos : c.heroImage ? [{ url: c.heroImage, credit: c.heroCredit }] : [],
    sketchfabUid: c.sketchfabUid,
    sketchfabCredit: c.sketchfabCredit,
    sketchfabPaint: (c.sketchfabPaint ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    configuratorUrl: c.configuratorUrl,
    priceFrom: c.priceFrom,
    status: c.status as CarView["status"],
    featured: c.featured,
    specs: {
      engine: c.engine,
      powerHp: c.powerHp,
      torqueNm: c.torqueNm,
      zeroToHundred: c.zeroToHundred,
      topSpeedKmh: c.topSpeedKmh,
      drivetrain: c.drivetrain,
      transmission: c.transmission,
      seats: c.seats,
      weightKg: c.weightKg,
    },
    colors: c.colors.map((x) => ({
      id: x.id,
      name: x.name,
      hex: x.hex,
      finish: x.finish as CarView["colors"][number]["finish"],
      kind: x.kind as CarView["colors"][number]["kind"],
      priceDelta: x.priceDelta,
    })),
    variants: c.variants.map((v) => ({
      id: v.id,
      name: v.name,
      priceDelta: v.priceDelta,
      powerHp: v.powerHp,
      torqueNm: v.torqueNm,
      zeroToHundred: v.zeroToHundred,
      topSpeedKmh: v.topSpeedKmh,
      note: v.note,
    })),
    priceHistory: c.priceHistory.map((p) => ({ date: p.recordedAt.toISOString(), priceUsd: p.priceUsd })),
  };
}

export async function getCars(filter: { brand?: string } = {}): Promise<CarView[]> {
  const rows = await db.car.findMany({
    where: filter.brand ? { brand: { slug: filter.brand } } : undefined,
    include,
    orderBy: [{ featured: "desc" }, { priceFrom: "desc" }],
  });
  return rows.map(toCarView);
}

export async function getCarBySlug(slug: string): Promise<CarView | null> {
  const row = await findOne(slug);
  return row ? toCarView(row) : null;
}

export async function getCarsBySlugs(slugs: string[]): Promise<CarView[]> {
  if (!slugs.length) return [];
  const rows = await db.car.findMany({ where: { slug: { in: slugs } }, include });
  return slugs.map((s) => rows.find((r) => r.slug === s)).filter(Boolean).map((r) => toCarView(r!));
}

export async function getRelatedCars(car: CarView, take = 3): Promise<CarView[]> {
  const rows = await db.car.findMany({
    where: { slug: { not: car.slug }, OR: [{ bodyType: car.bodyType }, { brand: { slug: car.brand.slug } }] },
    include,
    take,
  });
  return rows.map(toCarView);
}

export async function getBrands() {
  return db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { cars: true } }, cars: { select: { heroImage: true }, where: { heroImage: { not: null } }, take: 1, orderBy: { featured: "desc" } } },
  });
}

export async function recordView(slug: string) {
  await db.car.update({ where: { slug }, data: { views: { increment: 1 } } }).catch(() => {});
}
