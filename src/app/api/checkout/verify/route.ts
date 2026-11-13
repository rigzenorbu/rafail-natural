import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.razorpay_order_id || "");
  const paymentId = String(body.razorpay_payment_id || "");
  const signature = String(body.razorpay_signature || "");

  if (!orderId || !paymentId || !verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }
  const order = await markOrderPaid(orderId, paymentId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ orderNumber: order.orderNumber, token: order.accessToken });
}
