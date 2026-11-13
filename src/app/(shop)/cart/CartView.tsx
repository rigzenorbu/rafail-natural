"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useQuote } from "@/components/useQuote";
import Quantity from "@/components/Quantity";
import OrderSummary from "@/components/OrderSummary";
import { formatINR } from "@/lib/pricing";

export default function CartView() {
  const cart = useCart();
  const { quote, loading } = useQuote(cart.loaded ? cart.items : null);

  if (!cart.loaded || (loading && !quote)) return <p className="muted">Loading your cart…</p>;

  if (cart.items.length === 0) {
    return (
      <div className="empty" style={{ marginBottom: 24 }}>
        <p>Your cart is empty.</p>
        <Link href="/products" className="btn btn-primary">Start shopping</Link>
      </div>
    );
  }
  if (!quote) return <p className="alert alert-error">Could not load your cart. Please refresh the page.</p>;

  return (
    <div className="cart-layout">
      <div className="card">
        {quote.lines.map((line) =>
          line.available ? (
            <div className="cart-item" key={line.variantId}>
              <Link href={`/products/${line.slug}`}>{line.image ? <img src={line.image} alt="" /> : <div />}</Link>
              <div>
                <Link href={`/products/${line.slug}`} className="name">{line.name}</Link>
                <div className="muted small">{line.label}</div>
                <div className="small">
                  <b>{formatINR(line.price)}</b>
                  {line.discountPercent > 0 && <span className="mrp">{formatINR(line.mrp)}</span>}
                </div>
                {line.error && <div className="small" style={{ color: "var(--red)" }}>{line.error}</div>}
                <div className="actions">
                  <Quantity
                    small
                    value={line.quantity}
                    max={Math.max(1, Math.min(line.stock, 50))}
                    onChange={(n) => cart.setQuantity(line.variantId, n)}
                  />
                  <button className="btn-link small" onClick={() => cart.remove(line.variantId)}>Remove</button>
                </div>
              </div>
              <div className="line-total">{formatINR(line.lineTotal)}</div>
            </div>
          ) : (
            <div className="cart-item" key={line.variantId}>
              <div />
              <div>
                <div className="muted">{line.error}</div>
                <button className="btn-link small" onClick={() => cart.remove(line.variantId)}>Remove</button>
              </div>
              <div />
            </div>
          )
        )}
      </div>
      <div className="card">
        <h3>Order summary</h3>
        <OrderSummary quote={quote} />
        {quote.hasProblems && (
          <p className="alert alert-error small" style={{ marginTop: 12 }}>Please fix the items marked in red to continue.</p>
        )}
        <Link
          href="/checkout"
          className="btn btn-primary btn-lg btn-block"
          style={{ marginTop: 16, pointerEvents: quote.hasProblems ? "none" : undefined, opacity: quote.hasProblems ? 0.5 : 1 }}
          aria-disabled={quote.hasProblems}
        >
          Proceed to checkout
        </Link>
        <Link href="/products" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>Continue shopping</Link>
      </div>
    </div>
  );
}
