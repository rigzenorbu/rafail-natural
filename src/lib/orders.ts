import { randomBytes } from "crypto";
import { prisma } from "./db";
import { finalPrice } from "./pricing";
import { getSettings, razorpayEnabled } from "./settings";
import { getRazorpay } from "./razorpay";
import { sendOrderEmails } from "./email";
import { INDIAN_STATES } from "./constants";

export type CartInput = { variantId: number; quantity: number }[];
export type PaymentMethod = "ONLINE" | "COD";

export const MAX_QTY = 50;

export class OrderError extends Error {}

function cleanItems(items: unknown): CartInput {
  if (!Array.isArray(items)) return [];
  const merged = new Map<number, number>();
  for (const raw of items) {
    const variantId = Number(raw?.variantId);
    const quantity = Math.floor(Number(raw?.quantity));
    if (!Number.isInteger(variantId) || variantId <= 0 || !(quantity > 0)) continue;
    merged.set(variantId, Math.min((merged.get(variantId) || 0) + quantity, MAX_QTY));
  }
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}

// Calculates prices on the server from the database. Never trust prices sent by the browser.
export async function buildQuote(rawItems: unknown, paymentMethod: PaymentMethod = "ONLINE") {
  const items = cleanItems(rawItems);
  const settings = await getSettings();
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    include: {
      product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
    },
  });

  const lines = items.map((item) => {
    const v = variants.find((x) => x.id === item.variantId);
    if (!v || !v.product.isActive) {
      return { variantId: item.variantId, quantity: item.quantity, available: false as const, error: "This item is no longer available" };
    }
    const price = finalPrice(v.price, v.discountPercent);
    const error = v.stock <= 0 ? "Out of stock" : v.stock < item.quantity ? `Only ${v.stock} left in stock` : null;
    return {
      variantId: v.id,
      productId: v.productId,
      slug: v.product.slug,
      name: v.product.name,
      label: v.label,
      image: v.product.images[0]?.url || "",
      weightGrams: v.weightGrams,
      mrp: v.price,
      price,
      discountPercent: v.discountPercent,
      quantity: item.quantity,
      stock: v.stock,
      lineTotal: price * item.quantity,
      available: true as const,
      error,
    };
  });

  const valid = lines.filter((l) => l.available);
  const subtotal = valid.reduce((s, l) => s + l.mrp * l.quantity, 0);
  const itemsTotal = valid.reduce((s, l) => s + l.lineTotal, 0);
  const shippingFee = itemsTotal === 0 || itemsTotal >= settings.freeShippingAbove ? 0 : settings.shippingFee;
  const codFee = paymentMethod === "COD" && itemsTotal > 0 ? settings.codFee : 0;

  return {
    lines,
    subtotal,
    discount: subtotal - itemsTotal,
    itemsTotal,
    shippingFee,
    codFee,
    total: itemsTotal + shippingFee + codFee,
    totalWeightGrams: valid.reduce((s, l) => s + l.weightGrams * l.quantity, 0),
    freeShippingAbove: settings.freeShippingAbove,
    codEnabled: settings.codEnabled,
    onlineEnabled: razorpayEnabled(),
    hasProblems: lines.some((l) => !l.available || l.error),
  };
}

export type Quote = Awaited<ReturnType<typeof buildQuote>>;

export type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
};

function validateCustomer(c: Partial<CustomerInput> | undefined): CustomerInput {
  const s = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
  const customer = {
    name: s(c?.name, 100),
    email: s(c?.email, 150).toLowerCase(),
    phone: s(c?.phone, 20).replace(/[\s-]/g, "").replace(/^\+91/, ""),
    addressLine1: s(c?.addressLine1),
    addressLine2: s(c?.addressLine2),
    city: s(c?.city, 100),
    state: s(c?.state, 100),
    pincode: s(c?.pincode, 10),
    notes: s(c?.notes, 500),
  };
  if (!customer.name) throw new OrderError("Please enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new OrderError("Please enter a valid email");
  if (!/^[6-9]\d{9}$/.test(customer.phone)) throw new OrderError("Please enter a valid 10-digit mobile number");
  if (!customer.addressLine1) throw new OrderError("Please enter your address");
  if (!customer.city) throw new OrderError("Please enter your city");
  if (!INDIAN_STATES.includes(customer.state)) throw new OrderError("Please select your state");
  if (!/^[1-9]\d{5}$/.test(customer.pincode)) throw new OrderError("Please enter a valid 6-digit pincode");
  return customer;
}

async function uniqueOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    const bytes = randomBytes(7);
    const code = Array.from(bytes, (b) => chars[b % chars.length]).join("");
    const orderNumber = `RN-${code}`;
    if (!(await prisma.order.findUnique({ where: { orderNumber } }))) return orderNumber;
  }
}

export async function createOrder(input: {
  items: unknown;
  customer: Partial<CustomerInput>;
  paymentMethod: PaymentMethod;
  userId?: number | null;
}) {
  const customer = validateCustomer(input.customer);
  const method: PaymentMethod = input.paymentMethod === "COD" ? "COD" : "ONLINE";
  const quote = await buildQuote(input.items, method);

  if (quote.lines.length === 0) throw new OrderError("Your cart is empty");
  if (quote.hasProblems) throw new OrderError("Some items in your cart are unavailable. Please review your cart.");
  if (method === "COD" && !quote.codEnabled) throw new OrderError("Cash on Delivery is not available");
  if (method === "ONLINE" && !quote.onlineEnabled) throw new OrderError("Online payment is not available right now");

  const lines = quote.lines.filter((l) => l.available);
  const orderNumber = await uniqueOrderNumber();

  // For online payment, create the Razorpay order first so a failure leaves nothing behind.
  const razorpayOrderId =
    method === "ONLINE"
      ? (
          await getRazorpay().orders.create({
            amount: quote.total * 100, // paise
            currency: "INR",
            receipt: orderNumber,
            notes: { orderNumber },
          })
        ).id
      : null;

  const order = await prisma.$transaction(async (tx) => {
    // COD orders reserve stock immediately; online orders when payment succeeds.
    if (method === "COD") {
      for (const l of lines) {
        const res = await tx.productVariant.updateMany({
          where: { id: l.variantId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (res.count === 0) throw new OrderError(`${l.name} (${l.label}) just went out of stock`);
      }
    }
    return tx.order.create({
      data: {
        orderNumber,
        accessToken: randomBytes(16).toString("hex"),
        userId: input.userId ?? null,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        addressLine1: customer.addressLine1,
        addressLine2: customer.addressLine2 || "",
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        notes: customer.notes || "",
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingFee: quote.shippingFee,
        codFee: quote.codFee,
        total: quote.total,
        totalWeightGrams: quote.totalWeightGrams,
        paymentMethod: method,
        status: method === "COD" ? "CONFIRMED" : "PENDING",
        stockDeducted: method === "COD",
        razorpayOrderId,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            productName: l.name,
            variantLabel: l.label,
            image: l.image,
            mrp: l.mrp,
            price: l.price,
            quantity: l.quantity,
          })),
        },
      },
      include: { items: true },
    });
  });

  if (method === "COD") await sendOrderEmails(order);
  return { order };
}

// Options the browser needs to open the Razorpay payment popup.
export function razorpayCheckoutOptions(order: {
  razorpayOrderId: string | null;
  total: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
}) {
  return {
    key: process.env.RAZORPAY_KEY_ID,
    order_id: order.razorpayOrderId,
    amount: order.total * 100,
    currency: "INR",
    name: "Rafail Natural",
    description: `Order ${order.orderNumber}`,
    prefill: { name: order.customerName, email: order.email, contact: order.phone },
    theme: { color: "#2f5d3a" },
  };
}

// Safe to call more than once (browser callback and webhook may both arrive).
export async function markOrderPaid(razorpayOrderId: string, razorpayPaymentId: string) {
  const res = await prisma.order.updateMany({
    where: { razorpayOrderId, paymentStatus: { not: "PAID" } },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId,
      paidAt: new Date(),
    },
  });
  const order = await prisma.order.findUnique({ where: { razorpayOrderId }, include: { items: true } });
  if (!order || res.count === 0) return order;

  await prisma.$transaction(async (tx) => {
    if (order.status === "PENDING") {
      await tx.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
    }
    if (!order.stockDeducted) {
      for (const i of order.items) {
        await tx.productVariant.updateMany({ where: { id: i.variantId }, data: { stock: { decrement: i.quantity } } });
      }
      await tx.order.update({ where: { id: order.id }, data: { stockDeducted: true } });
    }
  });
  const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
  await sendOrderEmails(fresh);
  return fresh;
}

export async function markPaymentFailed(razorpayOrderId: string) {
  await prisma.order.updateMany({
    where: { razorpayOrderId, paymentStatus: "PENDING" },
    data: { paymentStatus: "FAILED" },
  });
}

// Put stock back when an order is cancelled.
export async function restoreStock(orderId: number) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order?.stockDeducted) return;
    for (const i of order.items) {
      await tx.productVariant.updateMany({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } });
    }
    await tx.order.update({ where: { id: orderId }, data: { stockDeducted: false } });
  });
}
