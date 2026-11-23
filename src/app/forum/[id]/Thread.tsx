"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CommentView, PostView } from "@/lib/forum";
import { AuthorBadge, Body, FlairTag, ImageGrid, timeAgo, Votes } from "@/components/forum/bits";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { toast } from "@/lib/stores";
import { createComment, deleteComment, deletePost, moderatePost, updateComment } from "../actions";
import { PostForm } from "../PostForm";

type Me = { id: string; admin: boolean } | null;

function ReplyForm({ postId, parentId, onDone, autoFocus }: { postId: string; parentId?: string; onDone?: () => void; autoFocus?: boolean }) {
  const [reset, setReset] = useState(0);
  const [state, action, pending] = useActionState(createComment, null);
  useEffect(() => {
    if (state?.ok) {
      setReset((r) => r + 1);
      toast(state.message, "success");
      onDone?.();
    } else if (state && !state.ok) toast(state.message, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form key={reset} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea name="body" rows={parentId ? 3 : 4} maxLength={5000} autoFocus={autoFocus} placeholder={parentId ? "Write a reply…" : "Join the discussion…"} className="field leading-relaxed" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ImagePicker name="images" max={2} label="Photo" resetKey={reset} />
        <div className="flex gap-2">
          {onDone && <button type="button" onClick={onDone} className="btn btn-ghost !px-4 !py-2.5">Cancel</button>}
          <button disabled={pending} className="btn btn-primary !px-5 !py-2.5">{pending ? "Posting…" : "Reply"}</button>
        </div>
      </div>
    </form>
  );
}

function EditComment({ c, onDone }: { c: CommentView; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateComment, null);
  useEffect(() => {
    if (state?.ok) {
      toast(state.message, "success");
      onDone();
    } else if (state) toast(state.message, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="id" value={c.id} />
      <textarea name="body" defaultValue={c.body} rows={3} maxLength={5000} className="field" autoFocus />
      <div className="flex gap-2">
        <button disabled={pending} className="btn btn-primary !px-4 !py-2">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onDone} className="btn btn-ghost !px-4 !py-2">Cancel</button>
      </div>
    </form>
  );
}

function Comment({ c, postId, me, depth, locked }: { c: CommentView; postId: string; me: Me; depth: number; locked: boolean }) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const mine = me?.id === c.author.id;

  return (
    <div id={`c-${c.id}`} className={depth > 0 ? "border-l border-white/10 pl-4 md:pl-5" : ""}>
      <div className="py-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist">
          <button onClick={() => setCollapsed((x) => !x)} className="font-mono text-mist hover:text-ivory" aria-label={collapsed ? "Expand thread" : "Collapse thread"}>
            [{collapsed ? "+" : "−"}]
          </button>
          {c.deleted ? <span className="italic">[deleted]</span> : <AuthorBadge name={c.author.name} role={c.author.role} image={c.author.image} />}
          <span suppressHydrationWarning>· {timeAgo(c.createdAt)}</span>
          {c.editedAt && !c.deleted && <span>· edited</span>}
          {collapsed && <span>· {c.children.length} hidden {c.children.length === 1 ? "reply" : "replies"}</span>}
        </div>
        {!collapsed && (
          <>
            {editing ? (
              <EditComment c={c} onDone={() => { setEditing(false); router.refresh(); }} />
            ) : c.deleted ? (
              <p className="mt-1 text-sm italic text-mist">This reply was deleted.</p>
            ) : (
              <div className="mt-1.5">
                {c.body && <Body text={c.body} />}
                <ImageGrid images={c.images} small />
              </div>
            )}
            {!c.deleted && !editing && (
              <div className="mt-2 flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-mist">
                <Votes target={{ commentId: c.id }} score={c.score} myVote={c.myVote} signedIn={!!me} vertical={false} />
                {me && !locked && depth < 6 && <button onClick={() => setReplying((r) => !r)} className="rounded px-2 py-1 hover:bg-white/5 hover:text-ivory">Reply</button>}
                {mine && <button onClick={() => setEditing(true)} className="rounded px-2 py-1 hover:bg-white/5 hover:text-ivory">Edit</button>}
                {(mine || me?.admin) && (
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("Delete this reply?")) return;
                      start(async () => {
                        const r = await deleteComment(c.id);
                        toast(r.message, r.ok ? "success" : "error");
                        router.refresh();
                      });
                    }}
                    className="rounded px-2 py-1 text-red-300/80 hover:bg-white/5 hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            <AnimatePresence>
              {replying && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                  <ReplyForm postId={postId} parentId={c.id} autoFocus onDone={() => { setReplying(false); router.refresh(); }} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      {!collapsed && c.children.map((k) => <Comment key={k.id} c={k} postId={postId} me={me} depth={depth + 1} locked={locked} />)}
    </div>
  );
}

export function Thread({ post, comments, me }: { post: PostView; comments: CommentView[]; me: Me }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const mine = me?.id === post.author.id;

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.message, r.ok ? "success" : "error");
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-[1000px] px-5 pb-28 pt-32 md:px-10">
      <Link href="/forum" className="text-[11px] uppercase tracking-[0.25em] text-mist hover:text-gold">← The Paddock</Link>

      <article className="mt-6 flex gap-4 border border-white/[0.07] bg-onyx p-5 md:p-7" style={{ borderRadius: "var(--radius)" }}>
        {!post.deleted && <Votes target={{ postId: post.id }} score={post.score} myVote={post.myVote} signedIn={!!me} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist">
            {post.pinned && <span className="text-gold">📌 Pinned</span>}
            <FlairTag flair={post.flair} />
            {post.deleted ? <span className="italic">[deleted]</span> : <AuthorBadge name={post.author.name} role={post.author.role} image={post.author.image} />}
            <span suppressHydrationWarning>· {timeAgo(post.createdAt)}</span>
            {post.editedAt && <span>· edited</span>}
            {post.locked && <span>· 🔒 locked</span>}
          </div>

          {editing ? (
            <PostForm initial={{ id: post.id, title: post.title, body: post.body, flair: post.flair, images: post.images }} onDone={() => { setEditing(false); router.refresh(); }} />
          ) : (
            <>
              <h1 className="mt-3 font-display text-3xl leading-tight md:text-4xl" style={{ textTransform: "none", letterSpacing: "normal" }}>{post.title}</h1>
              {post.car && (
                <Link href={`/cars/${post.car.slug}`} className="mt-3 inline-flex items-center gap-3 border border-white/10 py-1.5 pl-1.5 pr-4 text-xs transition hover:border-gold" style={{ borderRadius: "var(--radius)" }}>
                  {post.car.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.car.image} alt="" className="h-8 w-12 object-cover" />
                  )}
                  <span><span className="text-gold">{post.car.brand}</span> {post.car.model} →</span>
                </Link>
              )}
              <div className="mt-4">{post.deleted ? <p className="italic text-mist">This post was deleted by its author.</p> : <Body text={post.body} />}</div>
              <ImageGrid images={post.images} />
            </>
          )}

          {!post.deleted && !editing && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4 text-[11px] uppercase tracking-[0.15em] text-mist">
              <span>💬 {post.commentCount} {post.commentCount === 1 ? "reply" : "replies"}</span>
              <button onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => toast("Link copied", "success"))} className="rounded px-2 py-1 hover:bg-white/5 hover:text-ivory">Share</button>
              {mine && <button onClick={() => setEditing(true)} className="rounded px-2 py-1 hover:bg-white/5 hover:text-ivory">Edit</button>}
              {(mine || me?.admin) && (
                <button disabled={pending} onClick={() => confirm("Delete this post? Replies stay visible.") && run(() => deletePost(post.id))} className="rounded px-2 py-1 text-red-300/80 hover:bg-white/5 hover:text-red-300">
                  Delete
                </button>
              )}
              {me?.admin && (
                <>
                  <button disabled={pending} onClick={() => run(() => moderatePost(post.id, { pinned: !post.pinned }))} className="rounded px-2 py-1 text-gold/80 hover:bg-white/5 hover:text-gold">{post.pinned ? "Unpin" : "Pin"}</button>
                  <button disabled={pending} onClick={() => run(() => moderatePost(post.id, { locked: !post.locked }))} className="rounded px-2 py-1 text-gold/80 hover:bg-white/5 hover:text-gold">{post.locked ? "Unlock" : "Lock"}</button>
                </>
              )}
            </div>
          )}
        </div>
      </article>

      <section className="mt-8">
        {me && !post.deleted && !post.locked && (
          <div className="border border-white/[0.07] bg-onyx p-5" style={{ borderRadius: "var(--radius)" }}>
            <ReplyForm postId={post.id} onDone={() => router.refresh()} />
          </div>
        )}
        {!me && (
          <Link href={`/login?next=/forum/${post.id}`} className="block border border-dashed border-white/15 p-5 text-center text-sm text-mist transition hover:border-gold hover:text-gold">
            Sign in to join the discussion →
          </Link>
        )}
        {post.locked && <p className="mt-4 text-sm text-mist">🔒 This thread is locked — no new replies.</p>}

        <div className="mt-6 divide-y divide-white/[0.05]">
          {comments.map((c) => <Comment key={c.id} c={c} postId={post.id} me={me} depth={0} locked={post.locked} />)}
        </div>
        {!comments.length && <p className="py-10 text-center text-sm text-mist">No replies yet. Be the first.</p>}
      </section>
    </div>
  );
}
