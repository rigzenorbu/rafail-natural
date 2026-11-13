import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveImage(file) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
