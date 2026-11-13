import nodemailer from "nodemailer";
import type { Order, OrderItem } from "@prisma/client";
import { formatINR } from "./pricing";
import { escapeHtml } from "./utils";
import { STATUS_LABELS, STORE_NAME } from "./constants";

type OrderWithItems = Order & { items: OrderItem[] };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  if (!to) return;
  if (!process.env.SMTP_HOST) {
    console.log(`\n[email not configured] To: ${to}\nSubject: ${subject}\n`);
    return;
  }
  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    // Never fail an order because an email could not be sent.
    console.error("Email failed:", err);
  }
}

function itemsTable(order: OrderWithItems) {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(i.productName)} (${escapeHtml(i.variantLabel)}) × ${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatINR(i.price * i.quantity)}</td>
      </tr>`
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 8px;${bold ? "font-weight:bold" : ""}">${label}</td><td style="padding:6px 8px;text-align:right;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    ${line("Discount", "−" + formatINR(order.discount))}
    ${line("Shipping", order.shippingFee ? formatINR(order.shippingFee) : "Free")}
    ${order.codFee ? line("COD charge", formatINR(order.codFee)) : ""}
    ${line("Total", formatINR(order.total), true)}
  </table>`;
}

function address(order: Order) {
  return [order.customerName, order.addressLine1, order.addressLine2, `${order.city}, ${order.state} - ${order.pincode}`, `Phone: ${order.phone}`]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");
}

function wrap(body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
    <h2 style="color:#2f5d3a">${STORE_NAME}</h2>${body}
    <p style="color:#888;font-size:12px;margin-top:24px">${STORE_NAME} · Products from Ladakh</p></div>`;
}

export async function sendOrderEmails(order: OrderWithItems) {
  const link = `${siteUrl()}/order/${order.orderNumber}?t=${order.accessToken}`;
  const payment = order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid online";

  await send(
    order.email,
    `Order ${order.orderNumber} confirmed – ${STORE_NAME}`,
    wrap(`<p>Hi ${escapeHtml(order.customerName)},</p>
      <p>Thank you for your order! We will let you know when it ships.</p>
      <p><b>Order:</b> ${order.orderNumber}<br><b>Payment:</b> ${payment}</p>
      ${itemsTable(order)}
      <p><b>Delivery address</b><br>${address(order)}</p>
      <p><a href="${link}">View your order</a></p>`)
  );

  await send(
    process.env.ADMIN_NOTIFY_EMAIL || "",
    `New order ${order.orderNumber} – ${formatINR(order.total)} (${order.paymentMethod})`,
    wrap(`<p><b>New order received.</b></p>
      <p><b>Order:</b> ${order.orderNumber}<br><b>Payment:</b> ${payment}
      ${order.razorpayPaymentId ? `<br><b>Razorpay payment ID:</b> ${order.razorpayPaymentId}` : ""}
      <br><b>Email:</b> ${escapeHtml(order.email)}</p>
      ${itemsTable(order)}
      <p><b>Ship to</b><br>${address(order)}</p>
      ${order.notes ? `<p><b>Note:</b> ${escapeHtml(order.notes)}</p>` : ""}
      <p><a href="${siteUrl()}/admin/orders/${order.id}">Open in admin panel</a></p>`)
  );
}

export async function sendStatusEmail(order: Order) {
  const link = `${siteUrl()}/order/${order.orderNumber}?t=${order.accessToken}`;
  const tracking =
    order.status === "SHIPPED" && order.trackingNumber
      ? `<p><b>Courier:</b> ${escapeHtml(order.courier || "-")}<br><b>Tracking number:</b> ${escapeHtml(order.trackingNumber)}</p>`
      : "";
  await send(
    order.email,
    `Order ${order.orderNumber}: ${STATUS_LABELS[order.status] || order.status}`,
    wrap(`<p>Hi ${escapeHtml(order.customerName)},</p>
      <p>Your order <b>${order.orderNumber}</b> is now <b>${STATUS_LABELS[order.status] || order.status}</b>.</p>
      ${tracking}<p><a href="${link}">View your order</a></p>`)
  );
}
