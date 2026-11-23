import { bus, getAuction, watchers } from "@/lib/auctions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events: pushes every bid and admin change for one auction, plus live watcher counts. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initial = await getAuction(id);
  if (!initial) return new Response("Not found", { status: 404 });

  const enc = new TextEncoder();
  const topic = `auction:${id}`;
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify({ ...((data as object) ?? {}), serverNow: Date.now() })}\n\n`));
        } catch {
          cleanup();
        }
      };
      const presence = () => bus.emit(`${topic}:presence`, watchers.get(id) ?? 0);
      const onUpdate = (payload: unknown) => send("update", payload);
      const onPresence = (count: number) => send("presence", { count });

      watchers.set(id, (watchers.get(id) ?? 0) + 1);
      bus.on(topic, onUpdate);
      bus.on(`${topic}:presence`, onPresence);
      send("update", { type: "update", view: initial });
      presence();
      const heartbeat = setInterval(() => send("ping", {}), 20000);

      let done = false;
      cleanup = () => {
        if (done) return;
        done = true;
        clearInterval(heartbeat);
        bus.off(topic, onUpdate);
        bus.off(`${topic}:presence`, onPresence);
        watchers.set(id, Math.max(0, (watchers.get(id) ?? 1) - 1));
        presence();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
