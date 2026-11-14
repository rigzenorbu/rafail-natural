import webpush from "web-push";
import { prisma } from "./db";
import { formatINR } from "./pricing";

// Sends an alert to every phone or computer where the owner turned on order alerts.
// It never throws: an order must not fail because an alert could not be sent.
let configured: boolean | null = null;
function setup() {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  configured = Boolean(pub && priv);
  if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@rafailnatural.com", pub!, priv!);
  return configured;
}

export async function pushToOwner(msg: { title: string; body: string; url: string; tag?: string }) {
  try {
    if (!setup()) return { sent: 0, devices: 0 };
    const subs = await prisma.pushSubscription.findMany();
    let sent = 0;
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(msg),
            { TTL: 24 * 60 * 60, urgency: "high" }
          );
          sent++;
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          // the device turned alerts off or the browser was reset: forget it
          if (code === 404 || code === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          else console.error("Order alert failed:", code ?? err);
        }
      })
    );
    return { sent, devices: subs.length };
  } catch (err) {
    console.error("Order alert failed:", err);
    return { sent: 0, devices: 0 };
  }
}

type AlertOrder = { id: number; orderNumber: string; total: number; paymentMethod: string; customerName: string; city: string };

export function newOrderAlert(order: AlertOrder) {
  const how =
    order.paymentMethod === "ONLINE" ? "Paid online" : order.paymentMethod === "UPI" ? "UPI / QR · check the payment" : "Cash on Delivery";
  return pushToOwner({
    title: `New order · ${formatINR(order.total)}`,
    body: `${order.orderNumber} · ${how}\n${order.customerName}, ${order.city}`,
    url: `/admin/orders/${order.id}`,
    tag: order.orderNumber,
  });
}
