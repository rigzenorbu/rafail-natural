import { NextResponse } from "next/server";
import { buildQuote } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const quote = await buildQuote(body.items, body.paymentMethod === "COD" ? "COD" : "ONLINE");
  return NextResponse.json(quote);
}
