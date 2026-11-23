import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PostForm } from "../PostForm";

export const metadata: Metadata = { title: "New post" };
export const dynamic = "force-dynamic";

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ car?: string; flair?: string }> }) {
  await requireUser("/forum/new");
  const sp = await searchParams;
  const cars = await db.car.findMany({ select: { slug: true, model: true, brand: { select: { name: true } } }, orderBy: [{ brand: { name: "asc" } }, { model: "asc" }] });
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-32 md:px-10">
      <Link href="/forum" className="text-[11px] uppercase tracking-[0.25em] text-mist hover:text-gold">← The Paddock</Link>
      <h1 className="mt-6 font-display text-5xl">New post</h1>
      <p className="mt-2 text-sm text-mist">Share a review, compare two cars, ask the community, or post something you spotted.</p>
      <PostForm cars={cars.map((c) => ({ slug: c.slug, label: `${c.brand.name} ${c.model}` }))} initial={{ car: sp.car, flair: sp.flair }} />
    </div>
  );
}
