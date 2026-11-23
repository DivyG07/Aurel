import "server-only";
import { db } from "./db";
import { imageUrl, parseIds } from "./uploads";

export const FLAIRS = ["DISCUSSION", "COMPARISON", "QUESTION", "REVIEW", "SPOTTED", "NEWS"] as const;
export type Flair = (typeof FLAIRS)[number];
export type Sort = "hot" | "new" | "top";

export interface Author {
  id: string;
  name: string;
  image: string | null;
  role: string;
}
export interface PostView {
  id: string;
  title: string;
  body: string;
  flair: Flair;
  author: Author;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  score: number;
  myVote: number;
  commentCount: number;
  images: { id: string; url: string }[];
  car: { slug: string; model: string; brand: string; image: string | null } | null;
  pinned: boolean;
  locked: boolean;
}
export interface CommentView {
  id: string;
  parentId: string | null;
  body: string;
  author: Author;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  score: number;
  myVote: number;
  images: { id: string; url: string }[];
  children: CommentView[];
}

const authorSelect = { id: true, name: true, email: true, image: true, role: true } as const;
const displayName = (u: { name: string | null; email: string | null }) => u.name?.trim() || u.email?.split("@")[0] || "member";
const toAuthor = (u: { id: string; name: string | null; email: string | null; image: string | null; role: string }): Author => ({ id: u.id, name: displayName(u), image: u.image, role: u.role });
const images = (json: string | null) => parseIds(json).map((id) => ({ id, url: imageUrl(id) }));

const postInclude = {
  author: { select: authorSelect },
  car: { select: { slug: true, model: true, heroImage: true, brand: { select: { name: true } } } },
};
type PostRow = Awaited<ReturnType<typeof db.forumPost.findFirstOrThrow<{ include: typeof postInclude }>>>;

function toPost(p: PostRow, myVote = 0): PostView {
  return {
    id: p.id,
    title: p.title,
    body: p.deletedAt ? "" : p.body,
    flair: p.flair as Flair,
    author: toAuthor(p.author),
    createdAt: p.createdAt.toISOString(),
    editedAt: p.editedAt?.toISOString() ?? null,
    deleted: !!p.deletedAt,
    score: p.score,
    myVote,
    commentCount: p.commentCount,
    images: p.deletedAt ? [] : images(p.imageIds),
    car: p.car ? { slug: p.car.slug, model: p.car.model, brand: p.car.brand.name, image: p.car.heroImage } : null,
    pinned: p.pinned,
    locked: p.locked,
  };
}

/** Reddit-style "hot": votes decay with age. */
const hotness = (score: number, created: Date) => (score + 1) / Math.pow((Date.now() - created.getTime()) / 3.6e6 + 2, 1.5);

export async function listPosts(opts: { sort: Sort; flair?: string; q?: string; userId?: string | null; carId?: string }) {
  const where = {
    deletedAt: null,
    ...(opts.flair && FLAIRS.includes(opts.flair as Flair) ? { flair: opts.flair } : {}),
    ...(opts.carId ? { carId: opts.carId } : {}),
    ...(opts.q ? { OR: [{ title: { contains: opts.q, mode: "insensitive" as const } }, { body: { contains: opts.q, mode: "insensitive" as const } }] } : {}),
  };
  const rows = await db.forumPost.findMany({
    where,
    include: postInclude,
    orderBy: opts.sort === "top" ? [{ score: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
    take: 200,
  });
  const sorted = opts.sort === "hot" ? [...rows].sort((a, b) => hotness(b.score, b.createdAt) - hotness(a.score, a.createdAt)) : rows;
  const pinnedFirst = [...sorted.filter((p) => p.pinned), ...sorted.filter((p) => !p.pinned)];
  const votes = opts.userId ? await db.forumVote.findMany({ where: { userId: opts.userId, postId: { in: rows.map((r) => r.id) } } }) : [];
  return pinnedFirst.map((p) => toPost(p, votes.find((v) => v.postId === p.id)?.value ?? 0));
}

export async function getPost(id: string, userId?: string | null) {
  const p = await db.forumPost.findUnique({ where: { id }, include: postInclude });
  if (!p) return null;
  const comments = await db.forumComment.findMany({ where: { postId: id }, include: { author: { select: authorSelect } }, orderBy: { createdAt: "asc" } });
  const votes = userId
    ? await db.forumVote.findMany({ where: { userId, OR: [{ postId: id }, { commentId: { in: comments.map((c) => c.id) } }] } })
    : [];
  const vote = (cid: string) => votes.find((v) => v.commentId === cid)?.value ?? 0;

  const nodes = new Map<string, CommentView>();
  for (const c of comments) {
    nodes.set(c.id, {
      id: c.id,
      parentId: c.parentId,
      body: c.deletedAt ? "" : c.body,
      author: toAuthor(c.author),
      createdAt: c.createdAt.toISOString(),
      editedAt: c.editedAt?.toISOString() ?? null,
      deleted: !!c.deletedAt,
      score: c.score,
      myVote: vote(c.id),
      images: c.deletedAt ? [] : images(c.imageIds),
      children: [],
    });
  }
  const roots: CommentView[] = [];
  for (const n of nodes.values()) (n.parentId && nodes.get(n.parentId) ? nodes.get(n.parentId)!.children : roots).push(n);
  // Best replies first within each level.
  const order = (list: CommentView[]) => {
    list.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
    list.forEach((c) => order(c.children));
  };
  order(roots);

  return { post: toPost(p, votes.find((v) => v.postId === id)?.value ?? 0), comments: roots };
}

export async function forumStats() {
  const [posts, comments, members] = await Promise.all([
    db.forumPost.count({ where: { deletedAt: null } }),
    db.forumComment.count({ where: { deletedAt: null } }),
    db.forumPost.groupBy({ by: ["authorId"], where: { deletedAt: null } }).then((r) => r.length),
  ]);
  return { posts, comments, members };
}
