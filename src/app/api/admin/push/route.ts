import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Remembers (or forgets) a device where the owner turned on order alerts.
function readSubscription(body: unknown) {
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  return {
    endpoint: String(b?.endpoint ?? "").slice(0, 1000),
    p256dh: String(b?.keys?.p256dh ?? "").slice(0, 200),
    auth: String(b?.keys?.auth ?? "").slice(0, 100),
  };
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const sub = readSubscription(await req.json().catch(() => null));
  if (!sub.endpoint.startsWith("https://") || !sub.p256dh || !sub.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.p256dh, auth: sub.auth },
    create: sub,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { endpoint } = readSubscription(await req.json().catch(() => null));
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
