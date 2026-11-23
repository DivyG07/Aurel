import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/**
 * Data every page's layout needs (brand list for the Marques menu, montage photos for the world
 * loader). Cached across requests so a page load doesn't hit the database for it each time;
 * admin edits revalidate the "catalog" tag.
 */
export const getShellData = unstable_cache(
  async () => {
    const [brands, montage] = await Promise.all([
      db.brand.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, name: true, accentHex: true, country: true, cars: { select: { heroImage: true }, where: { heroImage: { not: null } }, orderBy: { featured: "desc" }, take: 1 } },
      }),
      db.car.findMany({ where: { heroImage: { not: null } }, select: { heroImage: true }, take: 18 }).then((r) => r.map((c) => c.heroImage!)),
    ]);
    return { brands, montage };
  },
  ["shell-v1"],
  { tags: ["catalog"], revalidate: 600 },
);
