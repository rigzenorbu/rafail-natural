import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ProductCard, { cardInclude } from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import { priceSummary } from "@/lib/pricing";

export const metadata: Metadata = { title: "Shop" };

type Search = { category?: string; q?: string; sort?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { category, q, sort = "featured" } = await searchParams;
  const query = (q || "").trim();

  const [categories, products] = await Promise.all([
    // only categories that have something to sell, with how many
    prisma.category.findMany({
      where: { products: { some: { isActive: true } } },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { slug: category } } : {}),
      },
      include: cardInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Search and sorting are done here (the catalogue is small, and this works the same on every database).
  const needle = query.toLowerCase();
  const matches = needle
    ? products.filter((p) =>
        [p.name, p.shortDescription, p.description, p.category?.name || ""].some((t) => t.toLowerCase().includes(needle))
      )
    : products;

  // Sorting by price/discount is done here because prices live on the size options.
  const minPrice = (p: (typeof products)[number]) => priceSummary(p.variants)?.price ?? 0;
  const maxDiscount = (p: (typeof products)[number]) => Math.max(0, ...p.variants.map((v) => v.discountPercent));
  const inStock = (p: (typeof products)[number]) => (p.variants.some((v) => v.stock > 0) ? 0 : 1);
  const sorted = [...matches].sort((a, b) => {
    if (sort === "price-asc") return minPrice(a) - minPrice(b);
    if (sort === "price-desc") return minPrice(b) - minPrice(a);
    if (sort === "discount") return maxDiscount(b) - maxDiscount(a);
    if (sort === "newest") return 0;
    return inStock(a) - inStock(b) || Number(b.isFeatured) - Number(a.isFeatured);
  });

  const current = categories.find((c) => c.slug === category);
  const link = (slug?: string) => {
    const p = new URLSearchParams();
    if (slug) p.set("category", slug);
    if (query) p.set("q", query);
    if (sort !== "featured") p.set("sort", sort);
    const s = p.toString();
    return `/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container">
      <div className="page-head">
        <div className="breadcrumb"><Link href="/">Home</Link> / Shop{current ? ` / ${current.name}` : ""}</div>
        <h1>{query ? `Results for “${query}”` : current?.name || "All products"}</h1>
      </div>
      <div className="shop-layout">
        <aside className="sidebar">
          <h4>Categories</h4>
          <ul>
            <li><Link href={link()} className={!category ? "active" : ""}>All products</Link></li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={link(c.slug)} className={c.slug === category ? "active" : ""}>
                  {c.name} <span className="count">{c._count.products}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div>
          <div className="toolbar">
            <span className="muted">{sorted.length} product{sorted.length === 1 ? "" : "s"}</span>
            <SortSelect value={sort} />
          </div>
          {sorted.length === 0 ? (
            <div className="empty">
              <p>No products found.</p>
              <Link href="/products" className="btn btn-outline">See all products</Link>
            </div>
          ) : (
            <div className="product-grid">
              {sorted.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
