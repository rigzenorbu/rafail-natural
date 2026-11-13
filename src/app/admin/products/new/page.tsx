import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="breadcrumb"><Link href="/admin/products">Products</Link> / New</div>
          <h1>Add product</h1>
        </div>
      </div>
      <ProductForm categories={categories} />
    </>
  );
}
