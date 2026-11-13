"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { variantId: number; quantity: number };

type CartContextValue = {
  items: CartItem[];
  loaded: boolean;
  count: number;
  add: (variantId: number, quantity: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rn_cart";
const MAX_QTY = 50;

function readStorage(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((i) => Number.isInteger(i?.variantId) && Number.isInteger(i?.quantity) && i.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

// The cart lives in the browser (localStorage), so it survives page reloads.
// Prices are always re-calculated by the server.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setLoaded(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setItems(readStorage());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      loaded,
      count: items.reduce((s, i) => s + i.quantity, 0),
      add: (variantId, quantity) =>
        update((prev) => {
          const existing = prev.find((i) => i.variantId === variantId);
          if (existing) {
            return prev.map((i) =>
              i.variantId === variantId ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY) } : i
            );
          }
          return [...prev, { variantId, quantity: Math.min(quantity, MAX_QTY) }];
        }),
      setQuantity: (variantId, quantity) =>
        update((prev) =>
          prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(quantity, MAX_QTY)) } : i))
        ),
      remove: (variantId) => update((prev) => prev.filter((i) => i.variantId !== variantId)),
      clear: () => update(() => []),
    }),
    [items, loaded, update]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
