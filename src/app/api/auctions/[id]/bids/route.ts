import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bidSchema = z.object({
  firstName: z.string().trim().min(1).max(40),
  lastName: z.string().trim().min(1).max(40),
  amount: z.number().int().positive(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auction = await prisma.auction.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!auction) {
    return NextResponse.json({ error: "Aukce nenalezena." }, { status: 404 });
  }

  const bids = await prisma.bid.findMany({
    where: { auctionId: id },
    orderBy: [{ amount: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
  return NextResponse.json({ bids });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné JSON tělo." }, { status: 400 });
  }

  const parsed = bidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Zadejte jméno, příjmení a kladnou celou částku v Kč.",
      },
      { status: 400 },
    );
  }

  const { firstName, lastName, amount } = parsed.data;
  const bidderId = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({ where: { id } });
      if (!auction) {
        return { ok: false as const, status: 404, error: "Aukce nenalezena." };
      }
      if (auction.status !== "ACTIVE") {
        return {
          ok: false as const,
          status: 409,
          error: "Do této aukce nelze přihazovat (není aktivní).",
        };
      }
      if (auction.endsAt.getTime() <= Date.now()) {
        return {
          ok: false as const,
          status: 409,
          error: "Aukce už skončila.",
        };
      }
      if (amount <= auction.currentPrice) {
        return {
          ok: false as const,
          status: 409,
          error: `Příhoz musí být vyšší než aktuální cena (${auction.currentPrice} Kč).`,
        };
      }

      const bid = await tx.bid.create({
        data: {
          auctionId: id,
          bidderId,
          amount,
        },
      });
      const updated = await tx.auction.update({
        where: { id },
        data: { currentPrice: amount },
      });
      return { ok: true as const, bid, auction: updated };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(
      { bid: result.bid, auction: result.auction },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Příhoz se nepodařilo uložit." },
      { status: 500 },
    );
  }
}
