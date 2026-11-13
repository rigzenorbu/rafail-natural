import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 60);
  const slug = slugify(name);
  if (!slug) return NextResponse.json({ error: "Enter a category name" }, { status: 400 });
  const clash = await prisma.category.findUnique({ where: { slug } });
  if (clash && clash.id !== id) return NextResponse.json({ error: "This category already exists" }, { status: 400 });
  await prisma.category.update({ where: { id }, data: { name, slug } });
  return NextResponse.json({ ok: true });
}

// Products in a deleted category are kept, just without a category.
export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await prisma.category.deleteMany({ where: { id: Number((await params).id) } });
  return NextResponse.json({ ok: true });
}
