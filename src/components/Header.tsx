import Link from "next/link";
import CartButton from "./CartButton";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">R</span>
      <span>
        Rafail Natural
        <small>From the heights of Ladakh</small>
      </span>
    </span>
  );
}

export default async function Header() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <>
      {process.env.PAGES_BASE_PATH ? (
        <div className="announcement">Preview of the shop: you can browse everything here. Ordering and payment are switched off on this preview link.</div>
      ) : (
        settings.announcement && <div className="announcement">{settings.announcement}</div>
      )}
      <header className="header">
        <div className="container header-inner">
          <Link href="/" aria-label="Home"><Logo /></Link>
          <nav className="nav">
            <Link href="/products">Shop</Link>
            <Link href="/about">Our Story</Link>
            <Link href="/track">Track Order</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <form action="/products" className="header-search">
            <input name="q" type="search" placeholder="Search products…" aria-label="Search products" />
          </form>
          <div className="header-actions">
            <Link href={user ? "/account" : "/login"} className="row" style={{ gap: 6 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span className="hide-sm">{user ? user.name.split(" ")[0] : "Login"}</span>
            </Link>
            <CartButton />
          </div>
        </div>
        <nav className="mobile-nav">
          <Link href="/products">Shop</Link>
          <Link href="/about">Our Story</Link>
          <Link href="/track">Track Order</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>
    </>
  );
}
