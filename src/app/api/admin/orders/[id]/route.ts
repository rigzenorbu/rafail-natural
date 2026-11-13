import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { restoreStock } from "@/lib/orders";
import { sendStatusEmail } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = Number((await params).id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = ORDER_STATUSES.includes(body.status) ? (body.status as string) : order.status;
  const paymentStatus = PAYMENT_STATUSES.includes(body.paymentStatus) ? (body.paymentStatus as string) : order.paymentStatus;

  if (status === "CANCELLED" && order.status !== "CANCELLED") await restoreStock(id);
  if (order.status === "CANCELLED" && status !== "CANCELLED") {
    return NextResponse.json({ error: "A cancelled order cannot be re-opened. Ask the customer to order again." }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      paymentStatus,
      paidAt: paymentStatus === "PAID" && !order.paidAt ? new Date() : order.paidAt,
      courier: String(body.courier ?? order.courier).slice(0, 100),
      trackingNumber: String(body.trackingNumber ?? order.trackingNumber).slice(0, 100),
    },
  });

  if (status !== order.status && ["SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
    await sendStatusEmail(updated);
  }
  return NextResponse.json({ ok: true });
}
