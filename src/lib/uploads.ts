import "server-only";
import { db } from "./db";

const ALLOWED = ["image/webp", "image/jpeg", "image/png"];
const MAX_BYTES = 1_500_000; // per image, after client-side compression

export class UploadError extends Error {}

/** Validates and stores image files from a FormData field. Returns the new Upload ids, in order. */
export async function saveImages(ownerId: string, data: FormData, field: string, max: number) {
  const files = data.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > max) throw new UploadError(`You can attach up to ${max} images.`);
  const ids: string[] = [];
  for (const f of files) {
    if (!ALLOWED.includes(f.type)) throw new UploadError("Images must be JPEG, PNG or WebP.");
    if (f.size > MAX_BYTES) throw new UploadError("One of the images is too large (max 1.5 MB after compression).");
    const buf = Buffer.from(await f.arrayBuffer());
    const up = await db.upload.create({ data: { ownerId, mime: f.type, size: f.size, data: buf } });
    ids.push(up.id);
  }
  return ids;
}

export const imageUrl = (id: string) => `/api/uploads/${id}`;

export function parseIds(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Deletes uploads that belong to `ownerId` (never someone else's). */
export async function deleteUploads(ownerId: string, ids: string[]) {
  if (ids.length) await db.upload.deleteMany({ where: { id: { in: ids }, ownerId } });
}
