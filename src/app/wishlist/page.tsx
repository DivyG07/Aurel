import type { Metadata } from "next";
import { getCars } from "@/lib/cars";
import { WishlistClient } from "./WishlistClient";

export const metadata: Metadata = { title: "Wishlist" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const cars = await getCars();
  return (
    <div className="mx-auto max-w-[1480px] px-5 pb-28 pt-36 md:px-10">
      <p className="eyebrow">Saved</p>
      <h1 className="mt-4 font-display text-6xl leading-none md:text-8xl">Your wishlist</h1>
      <WishlistClient cars={cars} />
    </div>
  );
}
