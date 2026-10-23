import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminConfigured, isAdminSession } from "@/lib/admin";
import { recomputeAuctionCurrentPrice } from "@/lib/recompute-auction-price";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Admin may set any whole Kč >= 1 (overrides public min raise of 10). */
const schema = z.object({
  amount: z.number().int().min(1),
});

async function requireAdmin() {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Administrace je vypnutá — chybí ADMIN_SECRET. Nastavte ho ve Vercelu a znovu nasaďte aplikaci.",
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
  return null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Navýšení musí být celé číslo alespoň 1 Kč (ne prázdné, nula ani záporné).",
      },
      { status: 400 },
    );
  }

  const existing = await prisma.bid.findUnique({
    where: { id },
    select: { id: true, auctionId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Příhoz nenalezen." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const bid = await tx.bid.update({
      where: { id },
      data: { amount: parsed.data.amount },
    });
    const { currentPrice, startingPrice } = await recomputeAuctionCurrentPrice(
      tx,
      existing.auctionId,
    );

    const bidsAsc = await tx.bid.findMany({
      where: { auctionId: existing.auctionId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, amount: true },
    });
    let run = startingPrice;
    let resultingPrice = startingPrice;
    for (const b of bidsAsc) {
      run += b.amount;
      if (b.id === id) {
        resultingPrice = run;
        break;
      }
    }

    return {
      bid,
      auctionId: existing.auctionId,
      currentPrice,
      resultingPrice,
    };
  });

  return NextResponse.json({
    ok: true,
    bid: {
      id: result.bid.id,
      amount: result.bid.amount,
      resultingPrice: result.resultingPrice,
    },
    auction: {
      id: result.auctionId,
      currentPrice: result.currentPrice,
    },
  });
}
