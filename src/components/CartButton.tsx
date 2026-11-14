"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="icon-btn cart-btn" aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 7h12l-1 12.2a1 1 0 0 1-1 .8H8a1 1 0 0 1-1-.8L6 7Z" />
        <path d="M9 7V6a3 3 0 0 1 6 0v1" />
      </svg>
      {count > 0 && <span className="cart-count">{count}</span>}
    </Link>
  );
}
