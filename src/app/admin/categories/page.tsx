import { prisma } from "@/lib/db";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <>
      <div className="admin-head"><h1>Categories</h1></div>
      <CategoryManager categories={categories.map((c) => ({ id: c.id, name: c.name, count: c._count.products }))} />
    </>
  );
}
