import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { HeroVideo } from "@/components/home/Hero";

// Licensed stock clips (Pexels / Pixabay / Mixkit), hotlinked from the provider CDN.
type Raw = HeroVideo & { src: string; src720?: string | null };

function read<T>(file: string, fallback: T): T {
  const p = join(process.cwd(), "src", "data", "media", file);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, "utf8").replace(/^﻿/, "")) as T;
  } catch {
    return fallback;
  }
}

const clean = (list: Raw[]): HeroVideo[] =>
  list.filter((v) => v.src || v.src720).map((v) => ({ src: v.src || v.src720!, src720: v.src720 ?? null, poster: v.poster ?? null, title: v.title, car: v.car ?? null }));

/** Home page reel. */
export function getHeroVideos(): HeroVideo[] {
  return clean(read<Raw[]>("videos.json", [])).slice(0, 10);
}

/** A brand world's reel; empty when we have no clips of that marque (the page falls back to photos). */
export function getBrandVideos(slug: string): HeroVideo[] {
  return clean(read<Record<string, Raw[]>>("brand-videos.json", {})[slug] ?? []);
}
