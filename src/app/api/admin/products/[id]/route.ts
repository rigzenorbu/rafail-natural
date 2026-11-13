import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseProductInput, ProductError, saveProduct } from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = Number((await params).id);
  if (!(await prisma.product.findUnique({ where: { id } }))) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  try {
    await saveProduct(parseProductInput(await req.json()), id);
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof ProductError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = Number((await params).id);
  await prisma.product.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
