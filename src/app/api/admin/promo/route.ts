import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deletePromo, savePromo } from "@/lib/promo";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  try {
    await savePromo(file);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await deletePromo();
  return NextResponse.json({ ok: true });
}
