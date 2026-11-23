import "server-only";
import { db } from "./db";
import { imageUrl, parseIds } from "./uploads";

export interface GarageCarView {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  mileageKm: number | null;
  acquiredYear: number | null;
  estValueUsd: number | null;
  notes: string | null;
  isPublic: boolean;
  images: { id: string; url: string }[];
  /** Own photo first, else the catalogue photo of that model. */
  cover: string | null;
  catalog: { slug: string; powerHp: number; brandSlug: string } | null;
  owner?: { name: string };
}

const include = { car: { select: { slug: true, heroImage: true, powerHp: true, brand: { select: { slug: true } } } } };
type Row = Awaited<ReturnType<typeof db.garageCar.findFirstOrThrow<{ include: typeof include }>>>;

function toView(g: Row): GarageCarView {
  const images = parseIds(g.imageIds).map((id) => ({ id, url: imageUrl(id) }));
  return {
    id: g.id,
    make: g.make,
    model: g.model,
    year: g.year,
    color: g.color,
    mileageKm: g.mileageKm,
    acquiredYear: g.acquiredYear,
    estValueUsd: g.estValueUsd,
    notes: g.notes,
    isPublic: g.isPublic,
    images,
    cover: images[0]?.url ?? g.car?.heroImage ?? null,
    catalog: g.car ? { slug: g.car.slug, powerHp: g.car.powerHp, brandSlug: g.car.brand.slug } : null,
  };
}

export async function getMyGarage(userId: string) {
  const rows = await db.garageCar.findMany({ where: { userId }, include, orderBy: [{ year: "desc" }, { createdAt: "desc" }] });
  return rows.map(toView);
}

/** Public cars, grouped by owner, newest first. Owners show by first name + initial only. */
export async function getPublicGarages() {
  const rows = await db.garageCar.findMany({
    where: { isPublic: true, user: { banned: false } },
    include: { ...include, user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
  const owners = new Map<string, { id: string; name: string; role: string; cars: GarageCarView[] }>();
  for (const r of rows) {
    const base = r.user.name?.trim() || r.user.email?.split("@")[0] || "Collector";
    const [first, last] = base.split(/\s+/);
    const name = last ? `${first} ${last[0]}.` : first;
    if (!owners.has(r.user.id)) owners.set(r.user.id, { id: r.user.id, name, role: r.user.role, cars: [] });
    owners.get(r.user.id)!.cars.push(toView(r));
  }
  return [...owners.values()];
}
