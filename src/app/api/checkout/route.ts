import { NextResponse } from "next/server";
import { createOrder, OrderError, razorpayCheckoutOptions } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const user = await getCurrentUser();
    const { order } = await createOrder({
      items: body.items,
      customer: body.customer,
      paymentMethod: body.paymentMethod,
      userId: user?.id,
    });
    return NextResponse.json({
      orderNumber: order.orderNumber,
      token: order.accessToken,
      razorpay: order.paymentMethod === "ONLINE" ? razorpayCheckoutOptions(order) : null,
    });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("Checkout failed:", err);
    return NextResponse.json({ error: "Could not place the order. Please try again." }, { status: 500 });
  }
}
