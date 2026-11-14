import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { setAdminSession } from "@/lib/auth";

function same(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// After 5 wrong passwords from the same address, admin logins from there are blocked for 15 minutes.
const MAX_FAILS = 5;
const BLOCK_MS = 15 * 60 * 1000;
const fails = new Map<string, { count: number; until: number }>();

function clientAddress(req: Request) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const ip = clientAddress(req);
  const now = Date.now();
  const record = fails.get(ip);
  if (record && record.count >= MAX_FAILS && record.until > now) {
    const minutes = Math.ceil((record.until - now) / 60000);
    return NextResponse.json({ error: `Too many wrong attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const okEmail = same(email, (process.env.ADMIN_EMAIL || "").toLowerCase());
  const okPassword = !!process.env.ADMIN_PASSWORD && same(password, process.env.ADMIN_PASSWORD);
  if (!okEmail || !okPassword) {
    const r = record && record.until > now ? record : { count: 0, until: 0 };
    fails.set(ip, { count: r.count + 1, until: now + BLOCK_MS });
    await new Promise((r) => setTimeout(r, 800)); // slow down password guessing
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  }
  fails.delete(ip);
  const res = NextResponse.json({ ok: true });
  await setAdminSession(res);
  return res;
}
