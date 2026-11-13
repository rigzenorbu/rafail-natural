import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const { order, phone } = await searchParams;
  let notFoundMsg = false;

  if (order && phone) {
    const orderNumber = order.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const found = await prisma.order.findUnique({ where: { orderNumber } });
    if (found && found.phone === cleanPhone) redirect(`/order/${found.orderNumber}?t=${found.accessToken}`);
    notFoundMsg = true;
  }

  return (
    <div className="container">
      <div className="auth-box card">
        <h1 style={{ fontSize: "1.5rem" }}>Track your order</h1>
        <p className="muted">Enter your order number (e.g. RN-ABC1234) and the mobile number used for the order.</p>
        {notFoundMsg && <p className="alert alert-error small">No order found with these details.</p>}
        <form className="stack">
          <div className="field"><label>Order number</label><input className="input" name="order" required defaultValue={order} /></div>
          <div className="field"><label>Mobile number</label><input className="input" name="phone" required inputMode="numeric" defaultValue={phone} /></div>
          <button className="btn btn-primary btn-block">Track order</button>
        </form>
      </div>
    </div>
  );
}
