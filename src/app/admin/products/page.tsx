import Link from "next/link";
import { prisma } from "@/lib/db";
import { finalPrice, formatINR } from "@/lib/pricing";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="admin-head">
        <h1>Products ({products.length})</h1>
        <Link href="/admin/products/new" className="btn btn-primary">+ Add product</Link>
      </div>
      {products.length === 0 ? (
        <div className="empty">
          <p>No products yet.</p>
          <Link href="/admin/products/new" className="btn btn-primary">Add your first product</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th /><th>Product</th><th>Category</th><th>Sizes &amp; prices</th><th>Stock</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                return (
                  <tr key={p.id}>
                    <td>{p.images[0] ? <img src={p.images[0].url} alt="" /> : <div style={{ width: 44, height: 44, background: "var(--bg-soft)", borderRadius: 6 }} />}</td>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="link">{p.name}</Link>
                      {p.isFeatured && <div className="muted small">★ Bestseller</div>}
                    </td>
                    <td>{p.category?.name || <span className="muted">—</span>}</td>
                    <td className="small">
                      {p.variants.map((v) => (
                        <div key={v.id}>
                          {v.label}: <b>{formatINR(finalPrice(v.price, v.discountPercent))}</b>
                          {v.discountPercent > 0 && <span className="muted"> ({v.discountPercent}% off {formatINR(v.price)})</span>}
                        </div>
                      ))}
                    </td>
                    <td className="small">
                      {p.variants.map((v) => (
                        <div key={v.id} style={{ color: v.stock <= 0 ? "var(--red)" : v.stock <= 5 ? "var(--orange)" : undefined }}>
                          {v.stock}
                        </div>
                      ))}
                      {stock === 0 && <div className="muted">Out of stock</div>}
                    </td>
                    <td className="small"><span className={`dot ${p.isActive ? "dot-on" : "dot-off"}`} />{p.isActive ? "Visible" : "Hidden"}</td>
                    <td>
                      <div className="row" style={{ flexWrap: "nowrap", gap: 8 }}>
                        <Link href={`/admin/products/${p.id}`} className="btn btn-outline btn-sm">Edit</Link>
                        {p.isActive && <Link href={`/products/${p.slug}`} target="_blank" className="btn btn-outline btn-sm">View</Link>}
                        <DeleteButton url={`/api/admin/products/${p.id}`} confirmText={`Delete "${p.name}"? This cannot be undone.`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
