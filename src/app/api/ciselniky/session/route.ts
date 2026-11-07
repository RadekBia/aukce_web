import { NextResponse } from "next/server";
import { isCiselnikySession } from "@/lib/ciselniky-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await isCiselnikySession();
  return NextResponse.json({ ok });
}
