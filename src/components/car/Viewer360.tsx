"use client";

import { useEffect, useRef, useState } from "react";

// Sketchfab's embeddable player + Viewer API, with live repainting.
// Paint materials are found by, in order: an explicit per-car list (admin-editable),
// sampling what's under the centre of the screen (the car body), then name heuristics.

const API_SRC = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";

type Channel = { color?: number[]; enable?: boolean; factor?: number; texture?: unknown };
type Material = { name: string; channels: Record<string, Channel> };
type Api = {
  start: () => void;
  addEventListener: (e: string, cb: () => void) => void;
  getMaterialList: (cb: (err: unknown, list: Material[]) => void) => void;
  setMaterial: (m: Material, cb?: () => void) => void;
  pickFromScreen: (pos: [number, number], cb: (err: unknown, info?: { material?: { name: string } }) => void) => void;
};
declare global {
  interface Window {
    Sketchfab?: new (iframe: HTMLIFrameElement) => { init: (uid: string, opts: Record<string, unknown>) => void };
  }
}

const PAINT = /(car_?)?paint|carroc|lack|coachwork|body_?col|exterior_?col/i;
const NOT_PAINT = /glass|window|tyre|tire|rim|wheel|interior|int_|chrome|light|lamp|rubber|plastic|grill|leather|seat|logo|badge|brake|disc|carbon|alcantara|carpet|caliper|exhaust|mirror_glass|emiss|display|label|stitch|belt|plate|shadow|engine|floor|underbody/i;
const COLOR_CHANNELS = ["AlbedoPBR", "DiffusePBR", "DiffuseColor"];

const hexToLinear = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
};

function loadApi() {
  return new Promise<void>((resolve, reject) => {
    if (window.Sketchfab) return resolve();
    let s = document.querySelector<HTMLScriptElement>(`script[src="${API_SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = API_SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve(), { once: true });
    s.addEventListener("error", () => reject(new Error("viewer api")), { once: true });
  });
}

/** Sample a grid around the screen centre and return the material names hit, most frequent first. */
function sampleCentre(api: Api, w: number, h: number) {
  const pts: [number, number][] = [];
  for (const x of [0.35, 0.42, 0.5, 0.58, 0.65]) for (const y of [0.42, 0.5, 0.58]) pts.push([Math.round(x * w), Math.round(y * h)]);
  return new Promise<string[]>((resolve) => {
    const tally = new Map<string, number>();
    let done = 0;
    const finish = () => resolve([...tally.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n));
    const timer = setTimeout(finish, 2500);
    pts.forEach((p) =>
      api.pickFromScreen(p, (err, info) => {
        const name = !err ? info?.material?.name : undefined;
        if (name && !NOT_PAINT.test(name)) tally.set(name, (tally.get(name) ?? 0) + 1);
        if (++done === pts.length) {
          clearTimeout(timer);
          finish();
        }
      }),
    );
  });
}

export function Viewer360({
  uid,
  title,
  paint,
  paintMaterials,
  credit,
  onPaintSupport,
}: {
  uid: string;
  title: string;
  paint?: string;
  paintMaterials?: string[];
  credit?: string | null;
  onPaintSupport?: (ok: boolean) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const api = useRef<Api | null>(null);
  const paints = useRef<Material[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [paintReady, setPaintReady] = useState(0);
  const support = useRef(onPaintSupport);
  support.current = onPaintSupport;
  const overrides = (paintMaterials ?? []).join("|");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    paints.current = [];
    loadApi()
      .then(() => {
        if (cancelled || !frame.current || !window.Sketchfab) return;
        new window.Sketchfab(frame.current).init(uid, {
          autostart: 1,
          preload: 1,
          ui_theme: "dark",
          ui_infos: 0,
          ui_inspector: 0,
          ui_settings: 0,
          ui_help: 0,
          ui_annotations: 0,
          ui_vr: 0,
          dnt: 1,
          success: (a: Api) => {
            api.current = a;
            a.start();
            a.addEventListener("viewerready", () => {
              if (cancelled) return;
              setState("ready");
              a.getMaterialList(async (err, list) => {
                if (err || !list || cancelled) return support.current?.(false);
                const wanted = overrides ? overrides.split("|") : [];
                let found = wanted.length ? list.filter((m) => wanted.includes(m.name)) : [];
                if (!found.length && frame.current) {
                  // Let the first frames render before picking.
                  await new Promise((r) => setTimeout(r, 1200));
                  const hits = await sampleCentre(a, frame.current.clientWidth, frame.current.clientHeight);
                  const top = hits[0];
                  if (top) found = list.filter((m) => m.name === top);
                }
                if (!found.length) found = list.filter((m) => PAINT.test(m.name) && !NOT_PAINT.test(m.name));
                if (cancelled) return;
                paints.current = found;
                support.current?.(found.length > 0);
                setPaintReady((n) => n + 1);
              });
            });
          },
          error: () => !cancelled && setState("error"),
        });
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
      api.current = null;
      paints.current = [];
    };
  }, [uid, overrides]);

  useEffect(() => {
    if (!paint || !api.current || !paints.current.length) return;
    const color = hexToLinear(paint);
    for (const m of paints.current) {
      for (const ch of COLOR_CHANNELS) {
        const c = m.channels[ch];
        if (!c) continue;
        c.color = color;
        c.factor = 1;
        // A colour map would override the tint; paint is a flat colour, so drop it.
        if (c.texture) delete c.texture;
      }
      api.current.setMaterial(m);
    }
  }, [paint, paintReady]);

  return (
    <div className="relative h-full w-full bg-ink">
      <iframe ref={frame} title={`${title} — 360° view`} className="h-full w-full" allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen />
      {state === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ink">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border border-white/10 border-t-gold" />
            <p className="eyebrow">Loading 360° model</p>
          </div>
        </div>
      )}
      {state === "error" && <div className="absolute inset-0 grid place-items-center bg-ink text-center text-sm text-mist">The 360° viewer couldn&apos;t load. Check your connection and try again.</div>}
      {credit && <p className="pointer-events-none absolute bottom-1 left-14 text-[10px] text-white/60">{credit}</p>}
    </div>
  );
}
