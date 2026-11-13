import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid, markPaymentFailed } from "@/lib/orders";

// Razorpay calls this directly, so orders get marked paid even if the customer closes the browser.
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const event = JSON.parse(body);
  const payment = event?.payload?.payment?.entity;
  if (payment?.order_id) {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      await markOrderPaid(payment.order_id, payment.id);
    } else if (event.event === "payment.failed") {
      await markPaymentFailed(payment.order_id);
    }
  }
  return NextResponse.json({ ok: true });
}
