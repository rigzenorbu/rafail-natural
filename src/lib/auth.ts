import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { ADMIN_COOKIE, USER_COOKIE, signToken, verifyToken } from "./jwt";

export const cookieOptions = (days: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: days * 24 * 60 * 60,
});

export async function isAdmin() {
  const store = await cookies();
  const payload = await verifyToken(store.get(ADMIN_COOKIE)?.value);
  return payload?.role === "admin";
}

// Use at the top of every admin API route.
export async function requireAdmin() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  return null;
}

export async function getCurrentUser() {
  const store = await cookies();
  const payload = await verifyToken(store.get(USER_COOKIE)?.value);
  if (payload?.role !== "user") return null;
  return prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, name: true, email: true, phone: true },
  });
}

export async function setUserSession(res: NextResponse, userId: number) {
  res.cookies.set(USER_COOKIE, await signToken({ role: "user", sub: String(userId) }, 30), cookieOptions(30));
}

export async function setAdminSession(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, await signToken({ role: "admin", sub: "owner" }, 7), cookieOptions(7));
}
