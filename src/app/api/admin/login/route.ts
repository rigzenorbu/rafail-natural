import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { setAdminSession } from "@/lib/auth";

function same(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const okEmail = same(email, (process.env.ADMIN_EMAIL || "").toLowerCase());
  const okPassword = !!process.env.ADMIN_PASSWORD && same(password, process.env.ADMIN_PASSWORD);
  if (!okEmail || !okPassword) {
    await new Promise((r) => setTimeout(r, 800)); // slow down password guessing
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  await setAdminSession(res);
  return res;
}
