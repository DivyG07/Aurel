import { db } from "@/lib/db";
import { PageHead } from "../../ui";
import { CarForm } from "../CarForm";

export default async function NewCar() {
  const brands = await db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHead title="New listing" />
      <CarForm brands={brands} />
    </>
  );
}
