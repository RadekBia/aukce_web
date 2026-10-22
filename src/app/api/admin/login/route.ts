import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  adminSessionCookieValue,
  getAdminSecret,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Administrace není nastavená. Na Vercelu přidejte env proměnnou ADMIN_SECRET a znovu nasaďte aplikaci.",
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo." }, { status: 400 });
  }

  const password =
    typeof body === "object" &&
    body &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!password) {
    return NextResponse.json(
      { error: "Zadejte administrátorské heslo." },
      { status: 400 },
    );
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "Nesprávné heslo." },
      { status: 401 },
    );
  }

  const secret = getAdminSecret()!;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    ADMIN_COOKIE,
    adminSessionCookieValue(secret),
    adminCookieOptions(),
  );
  return res;
}
