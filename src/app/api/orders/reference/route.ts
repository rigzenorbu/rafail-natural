import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// The customer tells us the UPI reference (UTR) number of the payment they made,
// so the shop can find it in the bank app. It does not mark the order as paid.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "").replace(/\s/g, "").slice(0, 40);
  if (!/^[A-Za-z0-9]{6,40}$/.test(reference)) {
    return NextResponse.json({ error: "Please enter the UPI reference / UTR number from your payment app" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { orderNumber: String(body.orderNumber ?? "") } });
  if (!order || order.accessToken !== body.token || order.paymentMethod !== "UPI") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paymentStatus === "PAID" || order.status === "CANCELLED") {
    return NextResponse.json({ error: "This order can no longer be changed" }, { status: 400 });
  }
  await prisma.order.update({ where: { id: order.id }, data: { paymentReference: reference } });
  return NextResponse.json({ ok: true });
}
