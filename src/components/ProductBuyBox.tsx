"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import Quantity from "./Quantity";
import { finalPrice, formatINR, formatWeight } from "@/lib/pricing";

type Variant = { id: number; label: string; weightGrams: number; price: number; discountPercent: number; stock: number };

export default function ProductBuyBox({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const { add } = useCart();
  const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstInStock?.id);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(false);

  const v = variants.find((x) => x.id === selectedId);
  if (!v) return <p className="muted">This product is currently unavailable.</p>;

  const price = finalPrice(v.price, v.discountPercent);
  const maxQty = Math.max(1, Math.min(v.stock, 50));
  const out = v.stock <= 0;

  function addToCart() {
    add(v!.id, qty);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  return (
    <div>
      <div className="product-price">
        <span className="price">{formatINR(price)}</span>
        {v.discountPercent > 0 && (
          <>
            <span className="mrp">MRP {formatINR(v.price)}</span>
            <span className="off">{v.discountPercent}% off</span>
          </>
        )}
      </div>
      <p className="muted small" style={{ marginBottom: 18 }}>Inclusive of all taxes</p>

      <div className="label">Size</div>
      <div className="variant-options">
        {variants.map((x) => (
          <button
            key={x.id}
            type="button"
            className={`variant-btn ${x.id === v.id ? "active" : ""} ${x.stock <= 0 ? "oos" : ""}`}
            onClick={() => {
              setSelectedId(x.id);
              setQty(1);
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="row">
        <span className="label">Quantity</span>
        <Quantity value={qty} onChange={(n) => setQty(Math.max(1, Math.min(n, maxQty)))} max={maxQty} />
      </div>
      <div className={`stock-note ${out ? "out" : v.stock <= 5 ? "low" : ""}`}>
        {out ? "Currently out of stock" : v.stock <= 5 ? `Hurry, only ${v.stock} left` : "In stock"}
        {v.weightGrams > 0 && <span className="muted"> · Net weight {formatWeight(v.weightGrams)}</span>}
      </div>

      <div className="buy-actions">
        <button className="btn btn-outline btn-lg" disabled={out} onClick={addToCart}>Add to cart</button>
        <button
          className="btn btn-primary btn-lg"
          disabled={out}
          onClick={() => router.push(`/checkout?buy=${v.id}&qty=${qty}`)}
        >
          Buy now
        </button>
      </div>

      {toast && (
        <div className="toast" role="status">
          Added to cart <Link href="/cart">View cart →</Link>
        </div>
      )}
    </div>
  );
}
