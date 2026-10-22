import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "aukce_admin";

/** Raw ADMIN_SECRET from env, or null when unset (delete stays disabled). */
export function getAdminSecret(): string | null {
  const s = process.env.ADMIN_SECRET?.trim();
  return s ? s : null;
}

export function isAdminConfigured(): boolean {
  return getAdminSecret() !== null;
}

function sessionToken(secret: string): string {
  return createHmac("sha256", secret).update("aukce-admin-v1").digest("hex");
}

function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Compare submitted password to ADMIN_SECRET (timing-safe when lengths match). */
export function verifyAdminPassword(password: string): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;
  return safeEqualStr(password, secret);
}

export function adminSessionCookieValue(secret: string): string {
  return sessionToken(secret);
}

export async function isAdminSession(): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) return false;
  const store = await cookies();
  const val = store.get(ADMIN_COOKIE)?.value;
  if (!val) return false;
  return safeEqualStr(val, sessionToken(secret));
}

export function adminCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  };
}
