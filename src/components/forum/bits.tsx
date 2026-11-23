"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { vote } from "@/app/forum/actions";
import { toast } from "@/lib/stores";

export const flairMeta: Record<string, { label: string; color: string }> = {
  DISCUSSION: { label: "Discussion", color: "#c9a96e" },
  COMPARISON: { label: "Comparison", color: "#7fb2ff" },
  QUESTION: { label: "Question", color: "#ffb35c" },
  REVIEW: { label: "Review", color: "#6fd3a5" },
  SPOTTED: { label: "Spotted", color: "#ff7a8a" },
  NEWS: { label: "News", color: "#c49bff" },
};

export function FlairTag({ flair }: { flair: string }) {
  const m = flairMeta[flair] ?? flairMeta.DISCUSSION;
  return (
    <span className="inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: m.color, borderColor: `${m.color}66`, background: `${m.color}14` }}>
      {m.label}
    </span>
  );
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [[31536000, "y"], [2592000, "mo"], [604800, "w"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [n, u] of units) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
}

export function AuthorBadge({ name, role, image }: { name: string; role: string; image?: string | null }) {
  const tag = role === "ADMIN" ? { t: "Staff", c: "text-gold border-gold/50" } : role === "DEALER" ? { t: "Dealer", c: "text-sky-300 border-sky-300/40" } : { t: "Collector", c: "text-mist border-white/15" };
  return (
    <span className="inline-flex items-center gap-1.5">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-5 w-5 rounded-full object-cover" />
      ) : (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-gold/20 text-[10px] font-semibold text-gold">{name[0]?.toUpperCase()}</span>
      )}
      <span className="text-ivory/85">{name}</span>
      <span className={`rounded border px-1 text-[8px] uppercase tracking-[0.15em] ${tag.c}`}>{tag.t}</span>
    </span>
  );
}

/** Up/down voting with optimistic updates. */
export function Votes({ target, score, myVote, signedIn, vertical = true }: { target: { postId?: string; commentId?: string }; score: number; myVote: number; signedIn: boolean; vertical?: boolean }) {
  const [state, setState] = useState({ score, myVote });
  const [, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const cast = (dir: 1 | -1) => {
    if (!signedIn) {
      toast("Sign in to vote", "info");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = (state.myVote === dir ? 0 : dir) as 1 | -1 | 0;
    const prev = state;
    setState({ score: state.score + (next - state.myVote), myVote: next });
    start(async () => {
      const r = await vote(target, next);
      if (!r.ok) {
        setState(prev);
        toast(r.message, "error");
      } else setState({ score: r.score, myVote: next });
    });
  };

  const btn = (dir: 1 | -1) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cast(dir);
      }}
      aria-label={dir === 1 ? "Upvote" : "Downvote"}
      aria-pressed={state.myVote === dir}
      className={`grid h-7 w-7 place-items-center rounded transition hover:bg-white/10 ${state.myVote === dir ? (dir === 1 ? "text-gold" : "text-sky-300") : "text-mist"}`}
    >
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dir === -1 ? "rotate-180" : ""}`} fill={state.myVote === dir ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 4 4 13h5v7h6v-7h5z" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div className={`flex items-center ${vertical ? "flex-col" : "gap-1"}`}>
      {btn(1)}
      <motion.span key={state.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className={`min-w-6 text-center text-xs font-semibold tabular-nums ${state.myVote === 1 ? "text-gold" : state.myVote === -1 ? "text-sky-300" : "text-ivory/80"}`}>
        {state.score}
      </motion.span>
      {btn(-1)}
    </div>
  );
}

/** Image grid with a click-to-enlarge lightbox. */
export function ImageGrid({ images, small }: { images: { id: string; url: string }[]; small?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className={`mt-3 grid gap-2 ${small ? "grid-cols-4 sm:max-w-md" : images.length === 1 ? "grid-cols-1 sm:max-w-2xl" : "grid-cols-2 sm:max-w-2xl"}`}>
        {images.map((im) => (
          <button key={im.id} type="button" onClick={() => setOpen(im.url)} className={`relative overflow-hidden border border-white/10 bg-graphite ${small ? "aspect-square" : "aspect-[4/3]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
          </button>
        ))}
      </div>
      {open && (
        <button type="button" onClick={() => setOpen(null)} className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4" aria-label="Close image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="" className="max-h-[90vh] max-w-full object-contain" />
        </button>
      )}
    </>
  );
}

/** Plain-text body with paragraphs and auto-linked URLs. */
export function Body({ text }: { text: string }) {
  return (
    <div className="space-y-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ivory/85">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>
          {para.split(/(https?:\/\/[^\s]+)/g).map((part, j) =>
            /^https?:\/\//.test(part) ? (
              <a key={j} href={part} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline underline-offset-2">
                {part}
              </a>
            ) : (
              part
            ),
          )}
        </p>
      ))}
    </div>
  );
}
