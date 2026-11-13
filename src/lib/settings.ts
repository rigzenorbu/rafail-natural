import { prisma } from "./db";

export async function getSettings() {
  return prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export function razorpayEnabled() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
