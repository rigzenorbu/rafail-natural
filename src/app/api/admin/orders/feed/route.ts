import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { REAL_ORDER } from "@/lib/constants";

// Orders the owner has not opened yet. The admin panel checks this every few seconds.
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const newOrders = await prisma.order.findMany({
    where: { ...REAL_ORDER, seenAt: null },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, orderNumber: true, total: true, paymentMethod: true, customerName: true, city: true },
  });
  return NextResponse.json({ newOrders }, { headers: { "Cache-Control": "no-store" } });
}
