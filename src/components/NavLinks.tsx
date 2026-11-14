"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/products", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

// The main links, with the current page marked.
export default function NavLinks({ className }: { className: string }) {
  const path = usePathname();
  return (
    <nav className={className} aria-label="Main">
      {NAV.map((l) => {
        const on = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} className={on ? "is-active" : ""} aria-current={on ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
