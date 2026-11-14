import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatINR } from "@/lib/pricing";
import { METHOD_LABELS, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { UPI_PAYEE, UPI_VPA, upiLink, upiQr } from "@/lib/upi";
import { formatDate } from "@/lib/utils";
import PayNowButton from "./PayNowButton";
import UpiReferenceForm from "./UpiReferenceForm";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

const STEPS = ["CONFIRMED", "SHIPPED", "DELIVERED"];

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t } = await searchParams;
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  const user = await getCurrentUser();

  // Only the person with the private link, or the logged-in owner, can see an order.
  if (!order || (order.accessToken !== t && (!user || order.userId !== user.id))) notFound();

  const awaitingPayment = order.paymentMethod === "ONLINE" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";
  const upiPending = order.paymentMethod === "UPI" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";
  const upi = upiPending
    ? { qr: await upiQr(order.total, order.orderNumber), link: upiLink(order.total, order.orderNumber), phone: (await getSettings()).storePhone }
    : null;
  // Opens WhatsApp with the payment details already typed, addressed to the shop.
  const whatsapp = upi
    ? `https://wa.me/91${upi.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
        `Hello Rafail Natural, I have paid ${formatINR(order.total)} by UPI for my order ${order.orderNumber}.\nName: ${order.customerName}\nPhone: ${order.phone}\n(I am attaching the payment screenshot.)`
      )}`
    : "";
  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="container" style={{ maxWidth: 860, paddingTop: 32, paddingBottom: 24 }}>
      {awaitingPayment ? (
        <div className="card center" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: "1.5rem" }}>Payment pending</h1>
          <p className="muted">Your order <b>{order.orderNumber}</b> has been created but the payment is not complete yet.</p>
          <PayNowButton orderNumber={order.orderNumber} token={order.accessToken} total={order.total} />
        </div>
      ) : upi ? (
        <div className="card upi-pay" style={{ marginBottom: 20 }}>
          <div className="upi-pay-qr">
            <img src={upi.qr} alt={`UPI QR code to pay ${formatINR(order.total)} to ${UPI_PAYEE}`} width={280} height={280} />
            <div className="upi-pay-name">{UPI_PAYEE}</div>
            <div className="muted small">UPI · BHIM · YONO SBI · any UPI app</div>
          </div>
          <div className="upi-pay-info">
            <h1 style={{ fontSize: "1.5rem" }}>Scan &amp; pay {formatINR(order.total)}</h1>
            <p className="muted">
              Order <b>{order.orderNumber}</b> is reserved for you. It is confirmed as soon as we receive your payment.
            </p>
            <ol className="upi-steps">
              <li>Open any UPI app and scan this QR code. The amount <b>{formatINR(order.total)}</b> is already filled in.</li>
              <li>Check that the name shows <b>{UPI_PAYEE}</b>, then pay.</li>
              <li>Tap the green button to send us your payment details on WhatsApp. Attach the payment screenshot if you can.</li>
            </ol>
            <a className="btn btn-accent upi-open" href={upi.link}>Pay with a UPI app on this phone</a>
            <p className="muted small" style={{ margin: "10px 0 0" }}>
              UPI ID: <code>{UPI_VPA}</code>
            </p>
            {order.paymentReference && (
              <p className="alert alert-info small" style={{ margin: "14px 0 0" }}>
                We have your reference <b>{order.paymentReference}</b> and are checking the payment.
              </p>
            )}
            <a className="btn btn-lg btn-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">
              I have paid: send details on WhatsApp
            </a>
            <p className="muted small" style={{ margin: "8px 0 0" }}>
              Opens WhatsApp with your order details already written, to {upi.phone}. You only need to press send.
            </p>
            <details className="upi-ref-toggle" open={Boolean(order.paymentReference)}>
              <summary>No WhatsApp? Give us the UPI reference number instead</summary>
              <UpiReferenceForm orderNumber={order.orderNumber} token={order.accessToken} saved={order.paymentReference} />
            </details>
          </div>
        </div>
      ) : order.status === "CANCELLED" ? (
        <div className="card center" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: "1.5rem" }}>Order cancelled</h1>
          <p className="muted" style={{ margin: 0 }}>Order {order.orderNumber} has been cancelled. Please contact us if you have any questions.</p>
        </div>
      ) : (
        <div className="card center" style={{ marginBottom: 20 }}>
          <div className="success-icon">✓</div>
          <h1 style={{ fontSize: "1.6rem" }}>Thank you, {order.customerName.split(" ")[0]}!</h1>
          <p className="muted">
            Your order <b>{order.orderNumber}</b> has been placed. A confirmation has been sent to {order.email}.
          </p>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`step ${i <= stepIndex ? "done" : ""}`}>{STATUS_LABELS[s]}</div>
            ))}
          </div>
          {order.status === "SHIPPED" && order.trackingNumber && (
            <p className="alert alert-info" style={{ margin: 0 }}>
              Shipped via <b>{order.courier || "courier"}</b> · Tracking number: <b>{order.trackingNumber}</b>
            </p>
          )}
        </div>
      )}

      <div className="cart-layout order-layout">
        <div className="card">
          <div className="row space-between" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Items</h3>
            <span className="muted small">{formatDate(order.createdAt)}</span>
          </div>
          {order.items.map((i) => (
            <div className="mini-item" key={i.id}>
              {i.image ? <img src={i.image} alt="" /> : <div />}
              <div className="grow">
                <div>{i.productName}</div>
                <div className="muted small">{i.variantLabel} × {i.quantity} @ {formatINR(i.price)}</div>
              </div>
              <b>{formatINR(i.price * i.quantity)}</b>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div className="summary-row"><span>Price (MRP)</span><span>{formatINR(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="summary-row"><span>Discount</span><span className="green">−{formatINR(order.discount)}</span></div>}
            <div className="summary-row"><span>Shipping</span><span>{order.shippingFee ? formatINR(order.shippingFee) : "Free"}</span></div>
            {order.codFee > 0 && <div className="summary-row"><span>COD charge</span><span>{formatINR(order.codFee)}</span></div>}
            <div className="summary-row total"><span>Total</span><span>{formatINR(order.total)}</span></div>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3>Delivery address</h3>
            <p style={{ margin: 0 }}>
              {order.customerName}<br />
              {order.addressLine1}<br />
              {order.addressLine2 && <>{order.addressLine2}<br /></>}
              {order.city}, {order.state} – {order.pincode}<br />
              Phone: {order.phone}
            </p>
          </div>
          <div className="card">
            <h3>Payment</h3>
            <p style={{ margin: 0 }}>
              {METHOD_LABELS[order.paymentMethod] || order.paymentMethod}<br />
              <span className={`status-pill status-${order.paymentStatus}`}>{PAYMENT_LABELS[order.paymentStatus]}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="center" style={{ marginTop: 24 }}>
        <Link href="/products" className="btn btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
