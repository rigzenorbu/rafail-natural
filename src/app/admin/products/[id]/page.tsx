import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="breadcrumb"><Link href="/admin/products">Products</Link> / Edit</div>
          <h1>{product.name}</h1>
        </div>
        <div className="row">
          {product.isActive && <Link href={`/products/${product.slug}`} target="_blank" className="btn btn-outline btn-sm">View in store ↗</Link>}
          <DeleteButton
            url={`/api/admin/products/${product.id}`}
            confirmText={`Delete "${product.name}"? This cannot be undone. (Tip: untick "Visible in store" to just hide it.)`}
            label="Delete product"
            redirectTo="/admin/products"
          />
        </div>
      </div>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          images: product.images.map((i) => i.url),
          variants: product.variants.map((v) => ({
            id: v.id,
            label: v.label,
            weightGrams: String(v.weightGrams),
            price: String(v.price),
            discountPercent: String(v.discountPercent),
            stock: String(v.stock),
          })),
        }}
      />
    </>
  );
}
