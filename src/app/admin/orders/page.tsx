import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/pricing";
import { PAYMENT_LABELS, REAL_ORDER, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const TABS = [
  { key: "", label: "All orders" },
  { key: "PENDING", label: "Payment to check" },
  { key: "CONFIRMED", label: "To ship" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "unpaid", label: "Unpaid / abandoned" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q = "" } = await searchParams;
  const query = q.trim();

  const where: Prisma.OrderWhereInput =
    status === "unpaid"
      ? { paymentMethod: "ONLINE", paymentStatus: { not: "PAID" } }
      : status === "CANCELLED"
        ? { status: "CANCELLED" }
        : { ...REAL_ORDER, ...(status ? { status } : {}) };
  if (query) {
    where.AND = [{ OR: [{ orderNumber: { contains: query.toUpperCase() } }, { phone: { contains: query } }, { customerName: { contains: query } }, { email: { contains: query.toLowerCase() } }] }];
  }

  const orders = await prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" }, take: 200 });
  const href = (s: string) => `/admin/orders?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(query ? { q: query } : {}) })}`;

  return (
    <>
      <div className="admin-head">
        <h1>Orders</h1>
        <form className="row">
          {status && <input type="hidden" name="status" value={status} />}
          <input className="input" name="q" defaultValue={query} placeholder="Search order no., phone, name" style={{ width: 260 }} />
          <button className="btn btn-outline">Search</button>
        </form>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <Link key={t.key} href={href(t.key)} className={status === t.key ? "active" : ""}>{t.label}</Link>
        ))}
      </div>
      {status === "unpaid" && (
        <p className="alert alert-info small" style={{ marginBottom: 12 }}>
          These are online orders where the customer did not finish paying. Don&apos;t ship them. No stock was used for them.
        </p>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={7} className="muted center" style={{ padding: 32 }}>No orders found</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className={`clickable ${o.seenAt ? "" : "is-new"}`}>
                <td>
                  <Link href={`/admin/orders/${o.id}`} className="link">{o.orderNumber}</Link>
                  {!o.seenAt && <span className="new-pill">New</span>}
                </td>
                <td className="small">{formatDate(o.createdAt)}</td>
                <td>{o.customerName}<div className="muted small">{o.phone} · {o.city}</div></td>
                <td className="small">{o.items.map((i) => <div key={i.id}>{i.productName} ({i.variantLabel}) × {i.quantity}</div>)}</td>
                <td><b>{formatINR(o.total)}</b></td>
                <td>
                  <span className={`status-pill status-${o.paymentStatus}`}>{PAYMENT_LABELS[o.paymentStatus]}</span>
                  <div className="muted small">{o.paymentMethod === "COD" ? "Cash on delivery" : o.paymentMethod === "UPI" ? `UPI / QR${o.paymentReference ? ` · ref ${o.paymentReference}` : ""}` : "Online"}</div>
                </td>
                <td><span className={`status-pill status-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
