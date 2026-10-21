import { NextResponse } from "next/server";
import { z } from "zod";
import { isUnauthenticatedAuctionCreationEnabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(10000),
  category: z.string().min(2).max(60),
  condition: z.string().min(2).max(40),
  imageUrl: z.string().url().optional().or(z.literal("")),
  startingPrice: z.number().int().positive(),
  durationHours: z.number().int().min(1).max(720),
});

export async function GET() {
  const auctions = await prisma.auction.findMany({
    where: { status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: { endsAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ auctions });
}

export async function POST(req: Request) {
  if (!isUnauthenticatedAuctionCreationEnabled()) {
    return NextResponse.json(
      {
        error:
          "Vytváření aukcí je vypnuté. Pro lokální test nastavte ENABLE_UNAUTHENTICATED_AUCTION_CREATION=true a restartujte server.",
      },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data aukce." }, { status: 400 });
  }

  const d = parsed.data;
  const auction = await prisma.auction.create({
    data: {
      title: d.title,
      description: d.description,
      category: d.category,
      condition: d.condition,
      imageUrl: d.imageUrl || null,
      startingPrice: d.startingPrice,
      currentPrice: d.startingPrice,
      endsAt: new Date(Date.now() + d.durationHours * 3600000),
    },
  });
  return NextResponse.json({ auction }, { status: 201 });
}
