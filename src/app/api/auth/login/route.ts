import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setUserSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(String(body.password || ""), user.passwordHash))) {
    return NextResponse.json({ error: "Wrong email or password" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  await setUserSession(res, user.id);
  return res;
}
