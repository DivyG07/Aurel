import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { brands, cars, caliperPalette, interiorPalette } from "../src/data/catalog";

const prisma = new PrismaClient();

type Photo = { url: string; page: string; author: string; license: string; angle?: string };
type SketchModel = { uid: string; name: string; author: string; authorUrl?: string; license?: string | null; url: string };
type SketchEntry = { model: SketchModel | null; configuratorUrl?: string };

function readJson<T>(file: string): Record<string, T> {
  const p = join(__dirname, "..", "src", "data", "media", file);
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, "utf8").replace(/^﻿/, ""));
}

async function main() {
  const photos = readJson<Photo[]>("photos.json");
  const sketch = readJson<SketchEntry>("sketchfab.json");
  const paint = readJson<string>("paint.json");

  for (const b of brands) {
    await prisma.brand.upsert({ where: { slug: b.slug }, update: b, create: b });
  }

  for (const c of cars) {
    const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: c.brand } });
    const { exterior, variants, brand: _brand, ...fields } = c;
    const pics = photos[c.slug] ?? [];
    const sk = sketch[c.slug];
    const media = {
      heroImage: pics[0]?.url ?? null,
      heroCredit: pics[0] ? `${pics[0].author} · ${pics[0].license} · Wikimedia Commons` : null,
      sketchfabUid: sk?.model?.uid ?? null,
      sketchfabCredit: sk?.model ? `“${sk.model.name}” by ${sk.model.author} on Sketchfab` : null,
      sketchfabPaint: paint[c.slug] ?? null,
      configuratorUrl: sk?.configuratorUrl ?? null,
    };
    const data = { ...fields, ...media, status: c.status ?? "AVAILABLE", featured: c.featured ?? false, brandId: brand.id };

    const car = await prisma.car.upsert({ where: { slug: c.slug }, update: data, create: data });

    // Child rows of seeded cars are rebuilt every run.
    await prisma.carColor.deleteMany({ where: { carId: car.id } });
    await prisma.carVariant.deleteMany({ where: { carId: car.id } });
    await prisma.carMedia.deleteMany({ where: { carId: car.id } });
    await prisma.priceHistory.deleteMany({ where: { carId: car.id } });

    await prisma.carColor.createMany({
      data: [
        ...exterior.map((x, i) => ({ ...x, kind: "EXTERIOR", sortOrder: i, carId: car.id })),
        ...interiorPalette.map((x, i) => ({ ...x, kind: "INTERIOR", sortOrder: i, carId: car.id })),
        ...caliperPalette.map((x, i) => ({ ...x, kind: "CALIPER", sortOrder: i, carId: car.id })),
      ],
    });
    await prisma.carVariant.createMany({ data: variants.map((v, i) => ({ ...v, sortOrder: i, carId: car.id })) });
    await prisma.carMedia.createMany({
      data: pics.map((p, i) => ({ carId: car.id, type: "IMAGE", url: p.url, alt: `${brand.name} ${c.model}`, credit: `${p.author} · ${p.license} · ${p.page}`, sortOrder: i })),
    });
    await prisma.priceHistory.createMany({
      data: Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        const drift = 1 + Math.sin(i / 2 + c.priceFrom / 1e5) * 0.035 + i * 0.002;
        return { carId: car.id, priceUsd: Math.round((c.priceFrom * drift) / 1000) * 1000, recordedAt: d, source: "seed" };
      }),
    });
  }

  // Icons & their cars — every claim carries a public source URL. Rebuilt each run.
  const celebPath = join(__dirname, "..", "src", "data", "celebrities.json");
  if (existsSync(celebPath)) {
    type Celeb = { slug: string; name: string; profession: string; country?: string; bio?: string; cars: { make: string; model: string; year?: number | null; story?: string; sourceUrl: string; sourceName?: string; catalogSlug?: string | null }[] };
    const celebs: Celeb[] = JSON.parse(readFileSync(celebPath, "utf8").replace(/^﻿/, ""));
    // Only the seeded people are replaced; icons added in the admin survive a reseed.
    await prisma.celebrity.deleteMany({ where: { slug: { in: celebs.map((p) => p.slug) } } });
    for (const p of celebs) {
      const catalog = await prisma.car.findMany({ where: { slug: { in: p.cars.map((c) => c.catalogSlug).filter(Boolean) as string[] } }, select: { id: true, slug: true } });
      await prisma.celebrity.create({
        data: {
          slug: p.slug,
          name: p.name,
          profession: p.profession,
          country: p.country ?? null,
          bio: p.bio ?? null,
          cars: { create: p.cars.map((c, i) => ({ make: c.make, model: c.model, year: c.year ?? null, story: c.story ?? null, sourceUrl: c.sourceUrl, sourceName: c.sourceName ?? null, sortOrder: i, carId: catalog.find((x) => x.slug === c.catalogSlug)?.id ?? null })) },
        },
      });
    }
    console.log(`Seeded ${celebs.length} icons.`);
  }

  // Demo auctions, only on a fresh database so admin-created auctions are never touched.
  if ((await prisma.auction.count()) === 0) {
    const bySlug = async (slug: string) => (await prisma.car.findUniqueOrThrow({ where: { slug } })).id;
    const now = Date.now();
    const h = 3600_000;
    await prisma.auction.createMany({
      data: [
        { carId: await bySlug("bugatti-chiron-super-sport"), title: "2022 Bugatti Chiron Super Sport — One owner, 1,200 km", startingBid: 3_000_000, reservePrice: 3_400_000, bidIncrement: 25_000, startsAt: new Date(now - h), endsAt: new Date(now + 6 * h) },
        { carId: await bySlug("byd-yangwang-u9"), title: "Yangwang U9 — European import, launch edition", startingBid: 180_000, reservePrice: 220_000, bidIncrement: 5_000, startsAt: new Date(now + 26 * h), endsAt: new Date(now + 50 * h) },
        { carId: await bySlug("mclaren-750s"), title: "McLaren 750S Spider — Papaya Spark, MSO Bespoke", startingBid: 290_000, reservePrice: 320_000, bidIncrement: 5_000, startsAt: new Date(now - 72 * h), endsAt: new Date(now - 48 * h) },
      ],
    });
  }

  console.log(`Seeded ${brands.length} brands and ${cars.length} cars (${Object.keys(photos).length} with photo data, ${Object.values(sketch).filter((s) => s.model).length} with 360° models).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
