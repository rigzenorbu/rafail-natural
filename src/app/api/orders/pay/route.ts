import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { razorpayCheckoutOptions } from "@/lib/orders";

// Lets a customer retry payment for an unpaid online order.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const order = await prisma.order.findUnique({ where: { orderNumber: String(body.orderNumber || "") } });
  if (!order || order.accessToken !== body.token) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paymentMethod !== "ONLINE" || order.paymentStatus === "PAID" || order.status === "CANCELLED" || !order.razorpayOrderId) {
    return NextResponse.json({ error: "This order cannot be paid" }, { status: 400 });
  }
  return NextResponse.json({ razorpay: razorpayCheckoutOptions(order) });
}
