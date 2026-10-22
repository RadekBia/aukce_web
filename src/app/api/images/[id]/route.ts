import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = await prisma.auctionImage.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Obrázek nenalezen." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.data), {
    status: 200,
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
