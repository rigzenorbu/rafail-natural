import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 60);
  const slug = slugify(name);
  if (!slug) return NextResponse.json({ error: "Enter a category name" }, { status: 400 });
  if (await prisma.category.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: "This category already exists" }, { status: 400 });
  }
  const count = await prisma.category.count();
  const category = await prisma.category.create({ data: { name, slug, sortOrder: count } });
  return NextResponse.json(category);
}
