"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CarView } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { useCompare } from "@/lib/stores";
import { CarCard } from "@/components/car/CarCard";

export function WishlistClient({ cars }: { cars: CarView[] }) {
  const slugs = useWishlist((s) => s.slugs);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-64" />;
  const saved = cars.filter((c) => slugs.includes(c.slug));

  if (!saved.length) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-4xl">Nothing saved yet.</p>
        <p className="mt-3 text-sm text-mist">Tap the heart on any car to keep it here.</p>
        <Link href="/cars" className="btn btn-primary mt-8">Browse the collection</Link>
      </div>
    );
  }

  const total = saved.reduce((s, c) => s + c.priceFrom, 0);
  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-mist">{saved.length} {saved.length === 1 ? "car" : "cars"} · combined value {formatPrice(total)}</p>
        {saved.length >= 2 && (
          <Link
            href={`/compare?cars=${saved.slice(0, 3).map((c) => c.slug).join(",")}`}
            onClick={() => useCompare.setState({ items: saved.slice(0, 3).map((c) => ({ slug: c.slug, name: `${c.brand.name} ${c.model}`, image: c.heroImage })) })}
            className="btn btn-ghost"
          >
            Compare {Math.min(3, saved.length)} of these
          </Link>
        )}
      </div>
      <motion.div layout className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">{saved.map((c) => <CarCard key={c.id} car={c} />)}</AnimatePresence>
      </motion.div>
    </>
  );
}
