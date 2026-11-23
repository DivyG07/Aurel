import { getAuction } from "@/lib/auctions";

export const dynamic = "force-dynamic";

/** Polling fallback for clients whose network blocks Server-Sent Events. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const view = await getAuction((await params).id);
  if (!view) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ view, serverNow: Date.now() });
}
