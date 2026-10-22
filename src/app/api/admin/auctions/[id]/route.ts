import { NextResponse } from "next/server";
import { isAdminConfigured, isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Mazání je vypnuté — chybí ADMIN_SECRET. Nastavte ho ve Vercelu a znovu nasaďte aplikaci.",
      },
      { status: 403 },
    );
  }

  if (!(await isAdminSession())) {
    return NextResponse.json(
      { error: "Nejste přihlášeni jako administrátor. Otevřete /sprava." },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  try {
    await prisma.auction.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Aukce nenalezena nebo ji nelze smazat." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
