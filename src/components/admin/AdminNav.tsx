"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/promo", label: "Home banner" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav({ newOrders = 0 }: { newOrders?: number }) {
  const pathname = usePathname();
  return (
    <nav>
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""}>
            {l.label}
            {l.href === "/admin/orders" && newOrders > 0 && <span className="nav-badge" title={`${newOrders} new`}>{newOrders}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
