// Shared by server and browser code.

export function finalPrice(price: number, discountPercent: number) {
  const d = Math.min(Math.max(discountPercent || 0, 0), 100);
  return Math.round((price * (100 - d)) / 100);
}

export function formatINR(amount: number) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

export function formatWeight(grams: number) {
  if (!grams) return "";
  return grams >= 1000 ? `${+(grams / 1000).toFixed(2)} kg` : `${grams} g`;
}

type PricedVariant = { price: number; discountPercent: number; stock: number };

// Cheapest variant, used for "from ₹X" on product cards.
export function priceSummary(variants: PricedVariant[]) {
  if (variants.length === 0) return null;
  const sorted = [...variants].sort(
    (a, b) => finalPrice(a.price, a.discountPercent) - finalPrice(b.price, b.discountPercent)
  );
  const v = sorted[0];
  return {
    price: finalPrice(v.price, v.discountPercent),
    mrp: v.price,
    discountPercent: v.discountPercent,
    multiple: variants.length > 1,
    inStock: variants.some((x) => x.stock > 0),
  };
}
