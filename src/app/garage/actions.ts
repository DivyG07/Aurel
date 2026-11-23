"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { mirror } from "@/lib/sheets";
import { deleteUploads, parseIds, saveImages, UploadError } from "@/lib/uploads";

export type GarageState = { ok: boolean; message: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => {
  const v = str(f, k).replace(/[,\s]/g, "");
  return v === "" ? null : Math.round(Number(v));
};

/** Add a car to your garage, or update one (when `id` is present). */
export async function saveGarageCar(_prev: GarageState, f: FormData): Promise<GarageState> {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const id = str(f, "id");
  const thisYear = new Date().getFullYear();

  // Picking a catalogue car fills make/model from it; otherwise free text.
  const carSlug = str(f, "carSlug");
  const catalog = carSlug ? await db.car.findUnique({ where: { slug: carSlug }, include: { brand: true } }) : null;
  const make = (catalog?.brand.name ?? str(f, "make")).slice(0, 60);
  const model = (catalog?.model ?? str(f, "model")).slice(0, 80);
  const year = int(f, "year");
  const mileageKm = int(f, "mileageKm");
  const acquiredYear = int(f, "acquiredYear");
  const estValueUsd = int(f, "estValueUsd");

  if (!make || !model) return { ok: false, message: "Choose a car from the catalogue or type its make and model." };
  if (!year || year < 1886 || year > thisYear + 1) return { ok: false, message: `Year must be between 1886 and ${thisYear + 1}.` };
  if (mileageKm != null && (Number.isNaN(mileageKm) || mileageKm < 0)) return { ok: false, message: "Mileage can't be negative." };
  if (acquiredYear != null && (acquiredYear < year - 1 || acquiredYear > thisYear)) return { ok: false, message: "The year you acquired it doesn't look right." };
  if (estValueUsd != null && (Number.isNaN(estValueUsd) || estValueUsd < 0)) return { ok: false, message: "Value can't be negative." };

  const existing = id ? await db.garageCar.findUnique({ where: { id } }) : null;
  if (id && (!existing || existing.userId !== s.user.id)) return { ok: false, message: "That car isn't in your garage." };
  if (!id && (await db.garageCar.count({ where: { userId: s.user.id } })) >= 50) return { ok: false, message: "Garages hold up to 50 cars." };

  const current = parseIds(existing?.imageIds);
  const keep = f.getAll("keep").map(String).filter((k) => current.includes(k));
  let added: string[];
  try {
    added = await saveImages(s.user.id, f, "images", Math.max(0, 4 - keep.length));
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed." };
  }
  await deleteUploads(s.user.id, current.filter((c) => !keep.includes(c)));

  const data = {
    carId: catalog?.id ?? null,
    make,
    model,
    year,
    color: str(f, "color").slice(0, 60) || null,
    mileageKm,
    acquiredYear,
    estValueUsd,
    notes: str(f, "notes").slice(0, 1000) || null,
    imageIds: JSON.stringify([...keep, ...added]),
    isPublic: f.get("isPublic") === "on",
  };
  const car = id ? await db.garageCar.update({ where: { id }, data }) : await db.garageCar.create({ data: { ...data, userId: s.user.id } });
  mirror("Garages", { id: car.id, owner: s.user.email, make, model, year, color: data.color, mileageKm, estValueUsd, public: data.isPublic, updated: new Date() }, "id");
  revalidatePath("/garage");
  revalidatePath("/garages");
  return { ok: true, message: id ? `${make} ${model} updated.` : `${make} ${model} added to your garage.` };
}

export async function deleteGarageCar(id: string) {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const car = await db.garageCar.findUnique({ where: { id } });
  if (!car || car.userId !== s.user.id) return { ok: false, message: "That car isn't in your garage." };
  await deleteUploads(s.user.id, parseIds(car.imageIds));
  await db.garageCar.delete({ where: { id } });
  mirror("Garages", { id, owner: s.user.email, deleted: true }, "id");
  revalidatePath("/garage");
  revalidatePath("/garages");
  return { ok: true, message: `${car.make} ${car.model} removed.` };
}

export async function setGaragePublic(id: string, isPublic: boolean) {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const car = await db.garageCar.findUnique({ where: { id } });
  if (!car || car.userId !== s.user.id) return { ok: false, message: "That car isn't in your garage." };
  await db.garageCar.update({ where: { id }, data: { isPublic } });
  revalidatePath("/garage");
  revalidatePath("/garages");
  return { ok: true, message: isPublic ? "Now visible in Collectors' Garages." : "Now private." };
}
