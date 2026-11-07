import { NextResponse } from "next/server";
import {
  CISELNIKY_COOKIE,
  ciselnikyCookieOptions,
  ciselnikySessionCookieValue,
  verifyCiselnikyLogin,
} from "@/lib/ciselniky-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo." }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";
  const password =
    typeof body === "object" &&
    body &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!email.trim() || !password) {
    return NextResponse.json(
      { error: "Zadejte e-mail i heslo." },
      { status: 400 },
    );
  }

  if (!verifyCiselnikyLogin(email, password)) {
    return NextResponse.json(
      { error: "Nesprávný e-mail nebo heslo." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true, email: email.trim().toLowerCase() });
  res.cookies.set(
    CISELNIKY_COOKIE,
    ciselnikySessionCookieValue(),
    ciselnikyCookieOptions(),
  );
  return res;
}
