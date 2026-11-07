import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const CISELNIKY_COOKIE = "aukce_ciselniky";
export const CISELNIKY_DEFAULT_EMAIL = "robinpfeiffer91@gmail.com";

/** sha256("aukce-ciselniky-v1|" + fallback password). Override with CISELNIKY_PASSWORD. */
const FALLBACK_PASSWORD_SHA256 =
  "aa1f1eb4ef49562d7e1570d9c2feaa1215e69eb8ccb28e3157be5ddc09a8ed24";

export function passwordDigest(password: string): string {
  return createHash("sha256")
    .update(`aukce-ciselniky-v1|${password}`, "utf8")
    .digest("hex");
}

function expectedEmail(): string {
  return (process.env.CISELNIKY_EMAIL?.trim() || CISELNIKY_DEFAULT_EMAIL).toLowerCase();
}

function expectedDigest(): string {
  const envPass = process.env.CISELNIKY_PASSWORD?.trim();
  return envPass ? passwordDigest(envPass) : FALLBACK_PASSWORD_SHA256;
}

function sessionSecret(): string {
  return `${expectedEmail()}|${expectedDigest()}|ciselniky-session-v1`;
}

function sessionToken(): string {
  return createHmac("sha256", sessionSecret()).update("ok").digest("hex");
}

function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function verifyCiselnikyLogin(email: string, password: string): boolean {
  const mail = email.trim().toLowerCase();
  if (!mail || !password) return false;
  if (!safeEqualStr(mail, expectedEmail())) return false;
  return safeEqualStr(passwordDigest(password), expectedDigest());
}

export function ciselnikySessionCookieValue(): string {
  return sessionToken();
}

export async function isCiselnikySession(): Promise<boolean> {
  const store = await cookies();
  const val = store.get(CISELNIKY_COOKIE)?.value;
  if (!val) return false;
  return safeEqualStr(val, sessionToken());
}

export function ciselnikyCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}
