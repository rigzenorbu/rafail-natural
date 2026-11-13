// Edge-safe token helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "rn_admin";
export const USER_COOKIE = "rn_user";

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET is missing or too short in .env");
  return new TextEncoder().encode(secret);
}

export type TokenPayload = { role: "admin" | "user"; sub: string };

export async function signToken(payload: TokenPayload, days: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(key());
}

export async function verifyToken(token: string | undefined): Promise<TokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
