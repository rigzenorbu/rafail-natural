import { prisma } from "./db";
import { slugify, toInt } from "./utils";

export type VariantInput = {
  id?: number;
  label: string;
  weightGrams: number;
  price: number;
  discountPercent: number;
  stock: number;
};

export type ProductInput = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: number | null;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  variants: VariantInput[];
};

export class ProductError extends Error {}

// Checks and cleans the product form sent from the admin panel.
export function parseProductInput(body: any): ProductInput {
  const name = String(body?.name || "").trim().slice(0, 150);
  if (!name) throw new ProductError("Product name is required");

  const variants: VariantInput[] = (Array.isArray(body?.variants) ? body.variants : []).map((v: any, i: number) => {
    const label = String(v?.label || "").trim().slice(0, 50);
    const price = toInt(v?.price, -1);
    const discountPercent = toInt(v?.discountPercent, 0);
    const stock = toInt(v?.stock, 0);
    const weightGrams = toInt(v?.weightGrams, 0);
    if (!label) throw new ProductError(`Size/option ${i + 1}: enter a label (e.g. 250 g)`);
    if (price <= 0) throw new ProductError(`"${label}": price must be more than 0`);
    if (discountPercent < 0 || discountPercent > 90) throw new ProductError(`"${label}": discount must be between 0 and 90%`);
    if (stock < 0) throw new ProductError(`"${label}": stock cannot be negative`);
    if (weightGrams < 0) throw new ProductError(`"${label}": weight cannot be negative`);
    return { id: v?.id ? toInt(v.id) : undefined, label, price, discountPercent, stock, weightGrams };
  });
  if (variants.length === 0) throw new ProductError("Add at least one size/option with a price");

  const images = (Array.isArray(body?.images) ? body.images : [])
    .map((u: unknown) => String(u))
    .filter((u: string) => u.startsWith("/uploads/") || u.startsWith("https://"));

  return {
    name,
    slug: slugify(String(body?.slug || "") || name) || "product",
    shortDescription: String(body?.shortDescription || "").trim().slice(0, 300),
    description: String(body?.description || "").trim().slice(0, 10000),
    categoryId: body?.categoryId ? toInt(body.categoryId) : null,
    isActive: Boolean(body?.isActive),
    isFeatured: Boolean(body?.isFeatured),
    images,
    variants,
  };
}

export async function uniqueProductSlug(base: string, excludeId?: number) {
  let slug = base;
  for (let n = 2; ; n++) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n}`;
  }
}

export async function saveProduct(input: ProductInput, id?: number) {
  const slug = await uniqueProductSlug(input.slug, id);
  const data = {
    name: input.name,
    slug,
    shortDescription: input.shortDescription,
    description: input.description,
    categoryId: input.categoryId,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
  };
  const variantData = (v: VariantInput, i: number) => ({
    label: v.label,
    weightGrams: v.weightGrams,
    price: v.price,
    discountPercent: v.discountPercent,
    stock: v.stock,
    sortOrder: i,
  });

  if (!id) {
    return prisma.product.create({
      data: {
        ...data,
        images: { create: input.images.map((url, i) => ({ url, sortOrder: i })) },
        variants: { create: input.variants.map(variantData) },
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({ where: { id }, data });
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productImage.createMany({ data: input.images.map((url, i) => ({ productId: id, url, sortOrder: i })) });

    const keepIds = input.variants.filter((v) => v.id).map((v) => v.id!);
    await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keepIds } } });
    for (const [i, v] of input.variants.entries()) {
      if (v.id) {
        await tx.productVariant.updateMany({ where: { id: v.id, productId: id }, data: variantData(v, i) });
      } else {
        await tx.productVariant.create({ data: { ...variantData(v, i), productId: id } });
      }
    }
    return product;
  });
}
