"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/orders";
import type { CartItem } from "./CartProvider";

// Asks the server for current prices, stock and shipping for the given items.
export function useQuote(items: CartItem[] | null, paymentMethod: "ONLINE" | "COD" = "ONLINE") {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(items) + paymentMethod;

  useEffect(() => {
    if (items === null) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, paymentMethod }),
    })
      .then((r) => r.json())
      .then((q) => !cancelled && setQuote(q))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { quote, loading };
}
