"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/logins", label: "Login activity" },
  { href: "/admin/users", label: "Accounts" },
  { href: "/admin/cars", label: "Listings" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/auctions", label: "Auctions" },
  { href: "/admin/icons", label: "Icons" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/sheets", label: "Google Sheets" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`whitespace-nowrap border-l-2 px-3 py-2 text-sm transition ${active ? "border-gold bg-white/[0.04] text-ivory" : "border-transparent text-mist hover:text-ivory"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
