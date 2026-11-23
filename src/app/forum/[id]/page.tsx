import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/forum";
import { currentUser } from "@/lib/session";
import { Thread } from "./Thread";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getPost((await params).id);
  return data ? { title: data.post.title } : {};
}

export default async function PostPage({ params }: Params) {
  const user = await currentUser();
  const data = await getPost((await params).id, user?.id);
  if (!data) notFound();
  return <Thread post={data.post} comments={data.comments} me={user ? { id: user.id, admin: user.role === "ADMIN" } : null} />;
}
