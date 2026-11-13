import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseProductInput, ProductError, saveProduct } from "@/lib/products";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const product = await saveProduct(parseProductInput(await req.json()));
    return NextResponse.json({ id: product.id });
  } catch (err) {
    if (err instanceof ProductError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
