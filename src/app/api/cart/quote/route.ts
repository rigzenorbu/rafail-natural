import { NextResponse } from "next/server";
import { asPaymentMethod, buildQuote } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const quote = await buildQuote(body.items, asPaymentMethod(body.paymentMethod));
  return NextResponse.json(quote);
}
