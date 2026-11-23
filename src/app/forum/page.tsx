import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/session";
import { FLAIRS, forumStats, listPosts, type Sort } from "@/lib/forum";
import { ForumList } from "./ForumList";

export const metadata: Metadata = { title: "The Paddock — Community" };
export const dynamic = "force-dynamic";

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ sort?: string; flair?: string; q?: string }> }) {
  const sp = await searchParams;
  const sort: Sort = sp.sort === "new" || sp.sort === "top" ? sp.sort : "hot";
  const user = await currentUser();
  const [posts, stats] = await Promise.all([listPosts({ sort, flair: sp.flair, q: sp.q, userId: user?.id }), forumStats()]);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ sort, flair: sp.flair, q: sp.q, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/forum?${p}`;
  };

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-28 pt-32 md:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Community</p>
          <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">The Paddock</h1>
          <p className="mt-4 max-w-xl text-mist">Reviews, comparisons, spotted-in-the-wild and questions — from collectors and dealers.</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-mist">{stats.posts} posts · {stats.comments} replies · {stats.members} members posting</p>
        </div>
        <Link href={user ? "/forum/new" : "/login?next=/forum/new"} className="btn btn-primary">+ New post</Link>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-y border-white/[0.07] py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {(["hot", "new", "top"] as const).map((s) => (
            <Link key={s} href={qs({ sort: s })} className={`px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition ${sort === s ? "bg-gold text-ink" : "text-mist hover:text-ivory"}`} style={{ borderRadius: "var(--radius)" }}>
              {s === "hot" ? "🔥 Hot" : s === "new" ? "New" : "Top"}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-white/10" />
          <Link href={qs({ flair: undefined })} className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${!sp.flair ? "text-gold" : "text-mist hover:text-ivory"}`}>All</Link>
          {FLAIRS.map((f) => (
            <Link key={f} href={qs({ flair: f })} className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${sp.flair === f ? "text-gold" : "text-mist hover:text-ivory"}`}>
              {f.toLowerCase()}
            </Link>
          ))}
        </div>
        <form action="/forum" className="flex gap-2">
          <input type="hidden" name="sort" value={sort} />
          {sp.flair && <input type="hidden" name="flair" value={sp.flair} />}
          <input name="q" defaultValue={sp.q} placeholder="Search the paddock…" className="field !py-2 lg:w-64" />
        </form>
      </div>

      <ForumList posts={posts} signedIn={!!user} />
      {!posts.length && (
        <div className="py-24 text-center">
          <p className="font-display text-3xl">{sp.q || sp.flair ? "Nothing matches that." : "No posts yet — start the first thread."}</p>
          <Link href={user ? "/forum/new" : "/login?next=/forum/new"} className="btn btn-primary mt-6">Write a post</Link>
        </div>
      )}
    </div>
  );
}
