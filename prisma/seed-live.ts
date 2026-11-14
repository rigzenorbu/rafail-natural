// Fills a fresh live database with the real catalogue: categories, the five products,
// their photos and the shop settings. It only adds what is missing, so it never undoes
// changes made in the admin panel and is safe to run on every start.
//   npm run db:seed-live
import { PrismaClient } from "@prisma/client";
import { copyFile, mkdir } from "fs/promises";
import path from "path";
import catalog from "./live-catalog.json";

const prisma = new PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

async function main() {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...catalog.settings } });

  for (const c of catalog.categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  for (const [i, p] of catalog.products.entries()) {
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue; // already there: leave it as the owner has it
    for (const img of p.images) await copyFile(path.join(__dirname, "live-images", img), path.join(UPLOAD_DIR, img));
    const category = p.category ? await prisma.category.findUnique({ where: { slug: p.category } }) : null;
    const data = {
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      categoryId: category?.id ?? null,
      isActive: true,
      isFeatured: p.isFeatured,
      // the catalogue is listed oldest first; this keeps the same order on the home page
      createdAt: new Date(Date.UTC(2026, 10, 1) + i * 1000),
    };
    const product = await prisma.product.create({ data: { slug: p.slug, ...data } });
    await prisma.productImage.createMany({ data: p.images.map((img, k) => ({ productId: product.id, url: `/uploads/${img}`, sortOrder: k })) });
    await prisma.productVariant.createMany({ data: p.variants.map((v, k) => ({ productId: product.id, ...v, sortOrder: k })) });
    console.log(`  ✓ ${p.name}`);
  }
  console.log("Live catalogue ready.");
}

main().finally(() => prisma.$disconnect());
