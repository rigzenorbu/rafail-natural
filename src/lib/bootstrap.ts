import { mkdirSync } from "fs";
import path from "path";
import { prisma } from "./db";
import { dataDir } from "./paths";
import { SCHEMA_SQL } from "./schema-sql";
import catalog from "../../prisma/live-catalog.json";

// Runs once when the server starts. On a brand-new server it creates the database tables and
// adds the real catalogue (5 products, photos, settings). It only ever adds what is missing,
// so it never undoes changes the owner made in the admin panel.
export async function bootstrap() {
  const dir = dataDir();
  if (dir) for (const sub of ["", "uploads", "promo"]) mkdirSync(path.join(dir, sub), { recursive: true });

  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Product'"
  );
  if (tables.length === 0) {
    const statements = SCHEMA_SQL.split(/;\s*\n/)
      .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
      .filter(Boolean);
    for (const s of statements) await prisma.$executeRawUnsafe(s);
    console.log(`[setup] Created ${statements.length} database objects.`);
  }

  await prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...catalog.settings } });
  for (const c of catalog.categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  let added = 0;
  for (const [i, p] of catalog.products.entries()) {
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue;
    const category = p.category ? await prisma.category.findUnique({ where: { slug: p.category } }) : null;
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        categoryId: category?.id ?? null,
        isFeatured: p.isFeatured,
        // the catalogue is listed oldest first; this keeps the same order on the home page
        createdAt: new Date(Date.UTC(2026, 10, 1) + i * 1000),
        images: { create: p.images.map((url, k) => ({ url, sortOrder: k })) },
        variants: { create: p.variants.map((v, k) => ({ ...v, sortOrder: k })) },
      },
    });
    added++;
  }
  if (added) console.log(`[setup] Added ${added} products.`);
}
