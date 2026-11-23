"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FLAIRS } from "@/lib/forum";
import { deleteUploads, parseIds, saveImages, UploadError } from "@/lib/uploads";

export type ForumState = { ok: boolean; message: string } | null;

async function me() {
  const s = await auth();
  if (!s?.user?.id) return null;
  return { id: s.user.id, admin: s.user.role === "ADMIN" };
}
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function createPost(_prev: ForumState, f: FormData): Promise<ForumState> {
  const user = await me();
  if (!user) return { ok: false, message: "Please sign in to post." };
  const title = str(f, "title");
  const body = str(f, "body");
  const flair = str(f, "flair");
  if (title.length < 5 || title.length > 140) return { ok: false, message: "Titles need 5–140 characters." };
  if (body.length > 10000) return { ok: false, message: "That's a long one — please keep posts under 10,000 characters." };
  if (!FLAIRS.includes(flair as (typeof FLAIRS)[number])) return { ok: false, message: "Choose a category." };
  const carSlug = str(f, "car");
  const car = carSlug ? await db.car.findUnique({ where: { slug: carSlug }, select: { id: true } }) : null;
  let imageIds: string[];
  try {
    imageIds = await saveImages(user.id, f, "images", 4);
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed." };
  }
  const post = await db.forumPost.create({ data: { authorId: user.id, title, body, flair, carId: car?.id, imageIds: JSON.stringify(imageIds), score: 1 } });
  await db.forumVote.create({ data: { userId: user.id, postId: post.id, value: 1 } }); // authors upvote their own post, like Reddit
  revalidatePath("/forum");
  redirect(`/forum/${post.id}`);
}

export async function updatePost(_prev: ForumState, f: FormData): Promise<ForumState> {
  const user = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const id = str(f, "id");
  const post = await db.forumPost.findUnique({ where: { id } });
  if (!post || post.deletedAt) return { ok: false, message: "Post not found." };
  if (post.authorId !== user.id) return { ok: false, message: "You can only edit your own posts." };
  const title = str(f, "title");
  const body = str(f, "body");
  const flair = str(f, "flair");
  if (title.length < 5 || title.length > 140) return { ok: false, message: "Titles need 5–140 characters." };
  if (!FLAIRS.includes(flair as (typeof FLAIRS)[number])) return { ok: false, message: "Choose a category." };
  const current = parseIds(post.imageIds);
  const keep = f.getAll("keep").map(String).filter((k) => current.includes(k));
  let added: string[];
  try {
    added = await saveImages(user.id, f, "images", Math.max(0, 4 - keep.length));
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed." };
  }
  await deleteUploads(user.id, current.filter((c) => !keep.includes(c)));
  await db.forumPost.update({ where: { id }, data: { title, body, flair, imageIds: JSON.stringify([...keep, ...added]), editedAt: new Date() } });
  revalidatePath(`/forum/${id}`);
  revalidatePath("/forum");
  return { ok: true, message: "Post updated." };
}

export async function deletePost(id: string) {
  const user = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const post = await db.forumPost.findUnique({ where: { id } });
  if (!post || post.deletedAt) return { ok: false, message: "Post not found." };
  if (post.authorId !== user.id && !user.admin) return { ok: false, message: "You can only delete your own posts." };
  await deleteUploads(post.authorId, parseIds(post.imageIds));
  await db.forumPost.update({ where: { id }, data: { deletedAt: new Date(), body: "", imageIds: null } });
  revalidatePath("/forum");
  revalidatePath(`/forum/${id}`);
  return { ok: true, message: "Post deleted." };
}

export async function moderatePost(id: string, change: { pinned?: boolean; locked?: boolean }) {
  const user = await me();
  if (!user?.admin) return { ok: false, message: "Admins only." };
  await db.forumPost.update({ where: { id }, data: change });
  revalidatePath(`/forum/${id}`);
  revalidatePath("/forum");
  return { ok: true, message: change.pinned !== undefined ? (change.pinned ? "Pinned to the top." : "Unpinned.") : change.locked ? "Thread locked." : "Thread unlocked." };
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function createComment(_prev: ForumState, f: FormData): Promise<ForumState> {
  const user = await me();
  if (!user) return { ok: false, message: "Please sign in to reply." };
  const postId = str(f, "postId");
  const parentId = str(f, "parentId") || null;
  const body = str(f, "body");
  if (!body && !f.getAll("images").some((x) => x instanceof File && x.size > 0)) return { ok: false, message: "Write something or add a photo." };
  if (body.length > 5000) return { ok: false, message: "Please keep replies under 5,000 characters." };
  const post = await db.forumPost.findUnique({ where: { id: postId } });
  if (!post || post.deletedAt) return { ok: false, message: "This thread no longer exists." };
  if (post.locked && !user.admin) return { ok: false, message: "This thread is locked." };
  const parent = parentId ? await db.forumComment.findUnique({ where: { id: parentId } }) : null;
  if (parentId && (!parent || parent.postId !== postId)) return { ok: false, message: "That comment no longer exists." };
  let imageIds: string[];
  try {
    imageIds = await saveImages(user.id, f, "images", 2);
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed." };
  }
  const c = await db.$transaction(async (tx) => {
    const c = await tx.forumComment.create({ data: { postId, parentId, authorId: user.id, body, imageIds: JSON.stringify(imageIds), score: 1 } });
    await tx.forumVote.create({ data: { userId: user.id, commentId: c.id, value: 1 } });
    await tx.forumPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
    return c;
  });
  // Tell whoever was replied to.
  const notifyId = parent ? parent.authorId : post.authorId;
  if (notifyId !== user.id) {
    const who = await db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } });
    await db.notification.create({
      data: { userId: notifyId, type: "SYSTEM", title: `${who?.name ?? "Someone"} replied to your ${parent ? "comment" : "post"}`, body: body.slice(0, 140) || "(photo)", href: `/forum/${postId}#c-${c.id}` },
    });
  }
  revalidatePath(`/forum/${postId}`);
  return { ok: true, message: "Reply posted." };
}

export async function updateComment(_prev: ForumState, f: FormData): Promise<ForumState> {
  const user = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const id = str(f, "id");
  const body = str(f, "body");
  const c = await db.forumComment.findUnique({ where: { id } });
  if (!c || c.deletedAt) return { ok: false, message: "Comment not found." };
  if (c.authorId !== user.id) return { ok: false, message: "You can only edit your own comments." };
  if (!body || body.length > 5000) return { ok: false, message: "Replies need 1–5,000 characters." };
  await db.forumComment.update({ where: { id }, data: { body, editedAt: new Date() } });
  revalidatePath(`/forum/${c.postId}`);
  return { ok: true, message: "Reply updated." };
}

export async function deleteComment(id: string) {
  const user = await me();
  if (!user) return { ok: false, message: "Please sign in." };
  const c = await db.forumComment.findUnique({ where: { id } });
  if (!c || c.deletedAt) return { ok: false, message: "Comment not found." };
  if (c.authorId !== user.id && !user.admin) return { ok: false, message: "You can only delete your own comments." };
  await deleteUploads(c.authorId, parseIds(c.imageIds));
  await db.$transaction([
    db.forumComment.update({ where: { id }, data: { deletedAt: new Date(), body: "", imageIds: null } }),
    db.forumPost.update({ where: { id: c.postId }, data: { commentCount: { decrement: 1 } } }),
  ]);
  revalidatePath(`/forum/${c.postId}`);
  return { ok: true, message: "Reply deleted." };
}

// ─── Votes ───────────────────────────────────────────────────────────────────

/** value: 1 up, -1 down, 0 clear. Returns the new score. */
export async function vote(target: { postId?: string; commentId?: string }, value: 1 | -1 | 0) {
  const user = await me();
  if (!user) return { ok: false as const, message: "Sign in to vote." };
  if (![1, -1, 0].includes(value) || (!target.postId === !target.commentId)) return { ok: false as const, message: "Bad vote." };
  const score = await db.$transaction(async (tx) => {
    const where = target.postId ? { userId_postId: { userId: user.id, postId: target.postId } } : { userId_commentId: { userId: user.id, commentId: target.commentId! } };
    const existing = await tx.forumVote.findUnique({ where });
    const delta = value - (existing?.value ?? 0);
    if (value === 0) {
      if (existing) await tx.forumVote.delete({ where: { id: existing.id } });
    } else if (existing) {
      await tx.forumVote.update({ where: { id: existing.id }, data: { value } });
    } else {
      await tx.forumVote.create({ data: { userId: user.id, value, postId: target.postId, commentId: target.commentId } });
    }
    if (target.postId) return (await tx.forumPost.update({ where: { id: target.postId }, data: { score: { increment: delta } } })).score;
    return (await tx.forumComment.update({ where: { id: target.commentId! }, data: { score: { increment: delta } } })).score;
  });
  return { ok: true as const, score };
}
