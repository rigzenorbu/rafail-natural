import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatINR } from "@/lib/pricing";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const orders = await prisma.order.findMany({
    where: { userId: user.id, NOT: { paymentMethod: "ONLINE", paymentStatus: { not: "PAID" } } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container" style={{ paddingBottom: 24 }}>
      <div className="page-head row space-between">
        <div>
          <h1 style={{ marginBottom: 4 }}>Hello, {user.name.split(" ")[0]}</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
        </div>
        <LogoutButton />
      </div>
      <h2 style={{ marginTop: 24 }}>My orders</h2>
      {orders.length === 0 ? (
        <div className="empty">
          <p>You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="btn btn-primary">Start shopping</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><b>{o.orderNumber}</b></td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{o.items.map((i) => `${i.productName} (${i.variantLabel}) × ${i.quantity}`).join(", ")}</td>
                  <td>{formatINR(o.total)}</td>
                  <td><span className={`status-pill status-${o.paymentStatus}`}>{o.paymentMethod === "COD" ? "COD" : PAYMENT_LABELS[o.paymentStatus]}</span></td>
                  <td><span className={`status-pill status-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                  <td><Link className="link" href={`/order/${o.orderNumber}?t=${o.accessToken}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
