import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard, { cardInclude } from "@/components/ProductCard";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/pricing";
import { getPromo } from "@/lib/promo";
import PromoVideo from "@/components/PromoVideo";
import JarShowcase from "@/components/JarShowcase";
import { SHOWCASE, type ShowcaseProduct } from "@/lib/showcase";
import { finalPrice } from "@/lib/pricing";

export default async function HomePage() {
  const [products, categories, settings, promo, showcaseRows] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, include: cardInclude, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { products: { some: { isActive: true } } }, orderBy: { sortOrder: "asc" } }),
    getSettings(),
    getPromo(),
    prisma.product.findMany({
      where: { isActive: true, slug: { in: SHOWCASE.map((s) => s.slug) } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
  ]);
  const showcase: ShowcaseProduct[] = SHOWCASE.flatMap((look) => {
    const p = showcaseRows.find((r) => r.slug === look.slug);
    const v = p?.variants[0];
    if (!p || !v) return [];
    return [{
      ...look,
      name: p.name,
      shortDescription: p.shortDescription,
      image: p.images[0]?.url ?? look.label,
      variantId: v.id,
      sizeLabel: v.label,
      weightGrams: v.weightGrams,
      price: finalPrice(v.price, v.discountPercent),
      mrp: v.price,
      stock: v.stock,
    }];
  });
  // In-stock first, then bestsellers (featured), then newest.
  const inStock = (p: (typeof products)[number]) => (p.variants.some((v) => v.stock > 0) ? 0 : 1);
  const catalogue = [...products].sort((a, b) => inStock(a) - inStock(b) || Number(b.isFeatured) - Number(a.isFeatured));
  const heroImages = catalogue.map((p) => p.images[0]?.url).filter(Boolean).slice(0, 3) as string[];

  return (
    <>
      {showcase.length > 0 && <JarShowcase products={showcase} />}
      {promo ? (
        <section className="promo-banner">
          {promo.kind === "video" ? <PromoVideo src={promo.url} /> : <img src={promo.url} alt="Rafail Natural" />}
          <a href="#catalogue" className="btn btn-accent btn-lg promo-cta">Shop now ↓</a>
        </section>
      ) : showcase.length > 0 ? null : (
        <section className="hero">
          <div className="container hero-inner">
            <div>
              <div className="hero-eyebrow">Grown at 3,500 metres</div>
              <h1>Natural goodness from the heights of Ladakh</h1>
              <p>
                Seabuckthorn, sun-dried apricots, apples and traditional Ladakhi foods, sourced directly from local
                farmers and delivered to your doorstep anywhere in India.
              </p>
              <div className="row">
                <a href="#catalogue" className="btn btn-primary btn-lg">Shop all products</a>
                <Link href="/about" className="btn btn-outline btn-lg">Our story</Link>
              </div>
            </div>
            {heroImages.length >= 3 && (
              <div className="hero-images">
                {heroImages.map((url) => <img key={url} src={url} alt="" />)}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section" id="catalogue">
        <div className="container">
          <div className="section-head">
            <h2>Our products</h2>
            <Link href="/products" className="link">Search &amp; sort →</Link>
          </div>
          {categories.length > 0 && (
            <div className="chip-row">
              {categories.map((c) => (
                <Link key={c.id} href={`/products?category=${c.slug}`} className="chip">{c.name}</Link>
              ))}
            </div>
          )}
          {catalogue.length === 0 ? (
            <div className="empty"><p>Products are coming soon.</p></div>
          ) : (
            <div className="product-grid">
              {catalogue.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="story-teaser">
        <div className="container">
          <div className="hero-eyebrow">The person behind Rafail Natural</div>
          <blockquote>&ldquo;Many people saw my physical disability as a limitation, but I chose to see it as a challenge to overcome.&rdquo;</blockquote>
          <p>Rafail is a young entrepreneur from Ladakh. This is his business, and his story.</p>
          <Link href="/about" className="btn btn-lg">Read Rafail&rsquo;s story →</Link>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="features">
            <div className="feature">
              <div className="feature-icon">⛰</div>
              <h3>Sourced from Ladakh</h3>
              <p>Bought directly from farmers and cooperatives in Leh and Kargil.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">✿</div>
              <h3>100% natural</h3>
              <p>No artificial colours or preservatives. Just what the mountains grow.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⛟</div>
              <h3>All-India delivery</h3>
              <p>Free shipping on orders above {formatINR(settings.freeShippingAbove)}.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Secure payment</h3>
              <p>Scan &amp; Pay with any UPI app{settings.codEnabled ? ", or Cash on Delivery" : ""}.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
