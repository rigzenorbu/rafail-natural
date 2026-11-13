import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toInt } from "@/lib/utils";

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const data = {
    shippingFee: Math.max(0, toInt(b.shippingFee)),
    freeShippingAbove: Math.max(0, toInt(b.freeShippingAbove)),
    codEnabled: Boolean(b.codEnabled),
    codFee: Math.max(0, toInt(b.codFee)),
    storePhone: String(b.storePhone || "").slice(0, 50),
    storeEmail: String(b.storeEmail || "").slice(0, 100),
    storeAddress: String(b.storeAddress || "").slice(0, 300),
    announcement: String(b.announcement || "").slice(0, 200),
  };
  await prisma.setting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  return NextResponse.json({ ok: true });
}
