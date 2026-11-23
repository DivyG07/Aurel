import { db } from "@/lib/db";
import { PageHead } from "../../ui";
import { AuctionForm } from "../AuctionForm";

export default async function NewAuction({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const sp = await searchParams;
  const cars = await db.car.findMany({ include: { brand: true }, orderBy: [{ brand: { name: "asc" } }, { model: "asc" }] });
  return (
    <>
      <PageHead title="Schedule an auction" sub="Pick a listing, set the opening and closing date & time, and the bidding rules." />
      <AuctionForm cars={cars.map((c) => ({ id: c.id, label: `${c.year} ${c.brand.name} ${c.model}`, price: c.priceFrom }))} values={{ carId: sp.car }} />
    </>
  );
}
