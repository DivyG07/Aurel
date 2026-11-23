import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser(next = "/") {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Every admin page and admin server action calls this; non-admins never reach the code below it. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/?denied=1");
  return user;
}
