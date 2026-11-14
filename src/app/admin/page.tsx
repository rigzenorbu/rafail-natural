import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/pricing";
import { REAL_ORDER, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { razorpayEnabled } from "@/lib/settings";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [todayAgg, monthAgg, toShip, lowStock, recent, productCount] = await Promise.all([
    prisma.order.aggregate({ where: { ...REAL_ORDER, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { ...REAL_ORDER, createdAt: { gte: monthAgo } }, _sum: { total: true }, _count: true }),
    prisma.order.count({ where: { ...REAL_ORDER, status: "CONFIRMED" } }),
    prisma.productVariant.findMany({ where: { stock: { lte: 5 } }, include: { product: true }, orderBy: { stock: "asc" }, take: 10 }),
    prisma.order.findMany({ where: REAL_ORDER, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.product.count(),
  ]);

  return (
    <>
      <div className="admin-head">
        <h1>Dashboard</h1>
        <Link href="/admin/products/new" className="btn btn-primary">+ Add product</Link>
      </div>

      {!razorpayEnabled() && (
        <p className="alert alert-info" style={{ marginBottom: 20 }}>
          Razorpay is off (its keys are not set in the <code>.env</code> file). Customers pay by Scan &amp; Pay (UPI / QR) or Cash on Delivery. For UPI orders, check the payment in the SBI app and mark the order as Paid.
        </p>
      )}

      <div className="stats">
        <div className="stat"><div className="label">Today&apos;s orders</div><div className="value">{todayAgg._count}</div></div>
        <div className="stat"><div className="label">Today&apos;s sales</div><div className="value">{formatINR(todayAgg._sum.total || 0)}</div></div>
        <div className="stat"><div className="label">Sales (last 30 days)</div><div className="value">{formatINR(monthAgg._sum.total || 0)}</div><div className="muted small">{monthAgg._count} orders</div></div>
        <div className="stat"><div className="label">Waiting to ship</div><div className="value" style={{ color: toShip ? "var(--orange)" : undefined }}>{toShip}</div><Link href="/admin/orders?status=CONFIRMED" className="link small">View →</Link></div>
      </div>

      <div className="cart-layout" style={{ gridTemplateColumns: "1fr 340px" }}>
        <div>
          <div className="row space-between" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Recent orders</h3>
            <Link href="/admin/orders" className="link small">All orders →</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.length === 0 && <tr><td colSpan={4} className="muted center">No orders yet</td></tr>}
                {recent.map((o) => (
                  <tr key={o.id} className="clickable">
                    <td><Link href={`/admin/orders/${o.id}`} className="link">{o.orderNumber}</Link><div className="muted small">{formatDate(o.createdAt)}</div></td>
                    <td>{o.customerName}<div className="muted small">{o.city}</div></td>
                    <td>{formatINR(o.total)}<div className="muted small">{o.paymentMethod === "COD" ? "COD" : o.paymentMethod === "UPI" ? (o.paymentStatus === "PAID" ? "UPI paid" : "UPI, to check") : "Paid online"}</div></td>
                    <td><span className={`status-pill status-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Low stock</h3>
          {lowStock.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>All {productCount} products are well stocked.</p>
          ) : (
            lowStock.map((v) => (
              <div key={v.id} className="row space-between" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <Link href={`/admin/products/${v.productId}`} className="small">{v.product.name} <span className="muted">({v.label})</span></Link>
                <span className={`status-pill ${v.stock <= 0 ? "status-CANCELLED" : "status-SHIPPED"}`}>{v.stock <= 0 ? "Out" : `${v.stock} left`}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
