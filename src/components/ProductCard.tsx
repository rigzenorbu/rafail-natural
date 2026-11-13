import Link from "next/link";
import { formatINR, priceSummary } from "@/lib/pricing";

export type CardProduct = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  category: { name: string } | null;
  images: { url: string }[];
  variants: { price: number; discountPercent: number; stock: number }[];
};

export const cardInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { orderBy: { sortOrder: "asc" as const } },
};

export default function ProductCard({ product }: { product: CardProduct }) {
  const p = priceSummary(product.variants);
  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="img-wrap">
        {product.images[0] ? (
          <img src={product.images[0].url} alt={product.name} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%" }} />
        )}
      </div>
      {p && p.discountPercent > 0 && <span className="badge badge-sale">{p.discountPercent}% OFF</span>}
      {p && !p.inStock && <span className="badge badge-out">Out of stock</span>}
      <div className="body">
        {product.category && <span className="cat">{product.category.name}</span>}
        <span className="name">{product.name}</span>
        {product.shortDescription && <span className="short">{product.shortDescription}</span>}
        {p && (
          <div className="price-row">
            {p.multiple && <span className="muted small">From </span>}
            <span className="price">{formatINR(p.price)}</span>
            {p.discountPercent > 0 && <span className="mrp">{formatINR(p.mrp)}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
