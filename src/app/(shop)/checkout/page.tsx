import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ buy?: string; qty?: string }> }) {
  const { buy, qty } = await searchParams;
  const user = await getCurrentUser();
  const buyNow = buy ? { variantId: Number(buy), quantity: Math.max(1, Math.min(Number(qty) || 1, 50)) } : null;

  return (
    <div className="container">
      <div className="page-head"><h1>Checkout</h1></div>
      <CheckoutForm
        buyNow={buyNow && Number.isInteger(buyNow.variantId) ? buyNow : null}
        user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
      />
    </div>
  );
}
