import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR, formatWeight } from "@/lib/pricing";
import { PAYMENT_LABELS, STATUS_LABELS, METHOD_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import OrderStatusForm from "@/components/admin/OrderStatusForm";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await prisma.order.findUnique({ where: { id: Number((await params).id) }, include: { items: true, user: true } });
  if (!order) notFound();
  // opening an order clears its "new" mark
  if (!order.seenAt) await prisma.order.update({ where: { id: order.id }, data: { seenAt: new Date() } });
  const fullAddress = [order.customerName, order.addressLine1, order.addressLine2, `${order.city}, ${order.state} - ${order.pincode}`, `Phone: ${order.phone}`]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <div className="admin-head">
        <div>
          <div className="breadcrumb"><Link href="/admin/orders">Orders</Link> / {order.orderNumber}</div>
          <h1>Order {order.orderNumber}</h1>
          <div className="muted small">Placed {formatDate(order.createdAt)}</div>
        </div>
        <div className="row">
          <span className={`status-pill status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
          <span className={`status-pill status-${order.paymentStatus}`}>{PAYMENT_LABELS[order.paymentStatus]}</span>
        </div>
      </div>

      <div className="cart-layout" style={{ gridTemplateColumns: "1fr 360px" }}>
        <div className="stack">
          <div className="card">
            <h3>Items</h3>
            {order.items.map((i) => (
              <div className="mini-item" key={i.id}>
                {i.image ? <img src={i.image} alt="" /> : <div />}
                <div className="grow">
                  <Link href={`/admin/products/${i.productId}`} className="link">{i.productName}</Link>
                  <div className="muted small">{i.variantLabel} · {i.quantity} × {formatINR(i.price)}{i.mrp > i.price ? ` (MRP ${formatINR(i.mrp)})` : ""}</div>
                </div>
                <b>{formatINR(i.price * i.quantity)}</b>
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <div className="summary-row"><span>Price (MRP)</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="summary-row"><span>Discount</span><span>−{formatINR(order.discount)}</span></div>
              <div className="summary-row"><span>Shipping</span><span>{order.shippingFee ? formatINR(order.shippingFee) : "Free"}</span></div>
              {order.codFee > 0 && <div className="summary-row"><span>COD charge</span><span>{formatINR(order.codFee)}</span></div>}
              <div className="summary-row total"><span>Total</span><span>{formatINR(order.total)}</span></div>
              {order.totalWeightGrams > 0 && <p className="muted small" style={{ margin: "8px 0 0" }}>Total product weight: {formatWeight(order.totalWeightGrams)}</p>}
            </div>
          </div>
          <div className="card">
            <h3>Payment</h3>
            <div className="small stack">
              <div><b>Method:</b> {METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</div>
              <div><b>Status:</b> {PAYMENT_LABELS[order.paymentStatus]}{order.paidAt ? ` on ${formatDate(order.paidAt)}` : ""}</div>
              {order.paymentMethod === "UPI" && (
                <div><b>UPI reference from customer:</b> {order.paymentReference ? <code>{order.paymentReference}</code> : "not given yet"}</div>
              )}
              {order.razorpayPaymentId && <div><b>Razorpay payment ID:</b> <code>{order.razorpayPaymentId}</code></div>}
              {order.razorpayOrderId && <div><b>Razorpay order ID:</b> <code>{order.razorpayOrderId}</code></div>}
            </div>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3>Customer &amp; shipping address</h3>
            <p style={{ whiteSpace: "pre-line" }}>{fullAddress}</p>
            <p className="small" style={{ margin: 0 }}>
              <a className="link" href={`mailto:${order.email}`}>{order.email}</a><br />
              <a className="link" href={`tel:${order.phone}`}>Call</a> ·{" "}
              <a className="link" href={`https://wa.me/91${order.phone}`} target="_blank" rel="noreferrer">WhatsApp</a>
              {order.user && <><br /><span className="muted">Registered customer</span></>}
            </p>
            {order.notes && <p className="alert alert-info small" style={{ marginTop: 12, marginBottom: 0 }}><b>Note:</b> {order.notes}</p>}
          </div>
          <OrderStatusForm
            order={{
              id: order.id,
              status: order.status,
              paymentStatus: order.paymentStatus,
              paymentMethod: order.paymentMethod,
              courier: order.courier,
              trackingNumber: order.trackingNumber,
            }}
          />
        </div>
      </div>
    </>
  );
}
