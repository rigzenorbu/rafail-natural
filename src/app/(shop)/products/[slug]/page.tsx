import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ProductGallery from "@/components/ProductGallery";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductCard, { cardInclude } from "@/components/ProductCard";
import Description from "@/components/Description";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/pricing";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: { images: product.images[0]?.url ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, id: { not: product.id }, ...(product.categoryId ? { categoryId: product.categoryId } : {}) },
      include: cardInclude,
      take: 4,
    }),
    getSettings(),
  ]);

  return (
    <div className="container">
      <div className="page-head" style={{ paddingBottom: 0 }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link> / <Link href="/products">Shop</Link>
          {product.category && (
            <> / <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link></>
          )}
        </div>
      </div>
      <div className="product-layout">
        <ProductGallery images={product.images.map((i) => i.url)} name={product.name} />
        <div className="product-info">
          {product.category && <div className="hero-eyebrow" style={{ marginBottom: 6 }}>{product.category.name}</div>}
          <h1>{product.name}</h1>
          {product.shortDescription && <p className="muted">{product.shortDescription}</p>}
          <ProductBuyBox
            variants={product.variants.map((v) => ({
              id: v.id,
              label: v.label,
              weightGrams: v.weightGrams,
              price: v.price,
              discountPercent: v.discountPercent,
              stock: v.stock,
            }))}
          />
          <ul className="info-list">
            <li>⛟ Free delivery on orders above {formatINR(settings.freeShippingAbove)}, otherwise {formatINR(settings.shippingFee)}</li>
            <li>🔒 Secure payment with UPI, cards &amp; net banking{settings.codEnabled ? " · Cash on Delivery available" : ""}</li>
            <li>⛰ Sourced directly from Ladakh</li>
          </ul>
        </div>
      </div>

      {product.description && (
        <section className="card" style={{ marginBottom: 40 }}>
          <h3>Product details</h3>
          <Description text={product.description} />
        </section>
      )}

      {related.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div className="section-head"><h2>You may also like</h2></div>
          <div className="product-grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
