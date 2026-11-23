import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto grid max-w-[1600px] gap-8 px-5 pb-24 pt-28 md:px-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow">Admin console</p>
        <p className="mt-2 truncate text-xs text-mist">{admin.email}</p>
        <AdminNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
