"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { PostView } from "@/lib/forum";
import { AuthorBadge, FlairTag, timeAgo, Votes } from "@/components/forum/bits";

export function ForumList({ posts, signedIn }: { posts: PostView[]; signedIn: boolean }) {
  return (
    <ul className="mt-6 space-y-3">
      {posts.map((p, i) => (
        <motion.li key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
          <Link href={`/forum/${p.id}`} className="group flex gap-4 border border-white/[0.07] bg-onyx p-4 transition hover:border-gold/40 md:p-5" style={{ borderRadius: "var(--radius)" }}>
            <Votes target={{ postId: p.id }} score={p.score} myVote={p.myVote} signedIn={signedIn} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist">
                {p.pinned && <span className="text-gold">📌 Pinned</span>}
                <FlairTag flair={p.flair} />
                <AuthorBadge name={p.author.name} role={p.author.role} />
                <span suppressHydrationWarning>· {timeAgo(p.createdAt)}</span>
                {p.locked && <span>· 🔒 locked</span>}
              </div>
              <h2 className="mt-2 font-display text-2xl leading-snug transition group-hover:text-gold" style={{ textTransform: "none", letterSpacing: "normal" }}>{p.title}</h2>
              {p.body && <p className="mt-1 line-clamp-2 text-sm text-mist">{p.body}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.15em] text-mist">
                <span>💬 {p.commentCount} {p.commentCount === 1 ? "reply" : "replies"}</span>
                {p.images.length > 0 && <span>🖼 {p.images.length}</span>}
                {p.car && <span className="text-gold/80">{p.car.brand} {p.car.model}</span>}
              </div>
            </div>
            {p.images[0] && (
              <div className="hidden h-24 w-36 shrink-0 overflow-hidden border border-white/10 sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0].url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
            )}
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
