import Link from "next/link";
import CartButton from "./CartButton";
import NavLinks from "./NavLinks";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// A small mountain in a circle, the same mark as on the Snow Land labels.
function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <path d="M5 23 13.2 11.5l3.3 4.4 2.6-3.4L27 23" />
        <path d="m13.2 11.5 1.6 4.1 1.7-.7" />
      </svg>
    </span>
  );
}

export function Logo() {
  return (
    <span className="brand">
      <Mark />
      <span className="brand-text">
        <span className="brand-name">Rafail Natural</span>
        <span className="brand-tag">From the heights of Ladakh</span>
      </span>
    </span>
  );
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export default async function Header() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  // The browse-only GitHub preview shows no announcement; the real shop shows the one set in admin Settings.
  const announcement = process.env.PAGES_BASE_PATH ? "" : settings.announcement;
  return (
    <>
      {announcement && <div className="announcement">{announcement}</div>}
      <header className="header">
        <div className="container header-inner">
          <Link href="/" aria-label="Rafail Natural home" className="brand-link"><Logo /></Link>
          <NavLinks className="nav" />
          <div className="header-actions">
            <form action="/products" className="header-search" role="search">
              <SearchIcon />
              <input name="q" type="search" placeholder="Search products" aria-label="Search products" />
            </form>
            <details className="m-search">
              <summary className="icon-btn" aria-label="Search"><SearchIcon /></summary>
              <form action="/products" role="search">
                <input name="q" type="search" placeholder="Search products" aria-label="Search products" />
                <button className="btn btn-primary">Search</button>
              </form>
            </details>
            <Link href={user ? "/account" : "/login"} className="icon-btn" aria-label={user ? "My account" : "Log in"} title={user ? user.name : "Log in"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </Link>
            <CartButton />
          </div>
        </div>
        <NavLinks className="mobile-nav" />
      </header>
    </>
  );
}
