import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Serves a user-uploaded image. Ids are unguessable and content never changes, so cache hard. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const up = await db.upload.findUnique({ where: { id }, select: { data: true, mime: true } });
  if (!up) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(up.data), {
    headers: { "Content-Type": up.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
