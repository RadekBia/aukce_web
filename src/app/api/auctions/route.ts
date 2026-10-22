import { NextResponse } from "next/server";
import { z } from "zod";
import { storedImagePath } from "@/lib/auction-images";
import { isUnauthenticatedAuctionCreationEnabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(10000),
  category: z.string().min(2).max(60),
  condition: z.string().min(2).max(40),
  /** External pasted URL fallback (not stored as bytea). */
  imageUrl: z.string().url().optional().or(z.literal("")),
  imageUrls: z.array(z.string().url()).max(5).optional(),
  /** Neon-stored photo ids from POST /api/uploads. */
  imageIds: z.array(z.string().min(1)).max(5).optional(),
  startingPrice: z.number().int().positive(),
  durationHours: z.number().int().min(1).max(720),
});

export async function GET() {
  const auctions = await prisma.auction.findMany({
    where: { status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: { endsAt: "asc" },
    take: 100,
    include: {
      images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json({ auctions });
}

export async function POST(req: Request) {
  if (!isUnauthenticatedAuctionCreationEnabled()) {
    return NextResponse.json(
      {
        error:
          "Vytváření aukcí je vypnuté (ENABLE_UNAUTHENTICATED_AUCTION_CREATION=false nebo po SSO).",
      },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data aukce." }, { status: 400 });
  }

  const d = parsed.data;
  const imageIds = Array.from(new Set(d.imageIds ?? [])).slice(0, 5);
  const externalUrls = Array.from(
    new Set(
      [...(d.imageUrls ?? []), d.imageUrl || ""].filter(
        (u): u is string => Boolean(u) && !u.startsWith("/api/images/"),
      ),
    ),
  ).slice(0, 5);

  if (imageIds.length > 0) {
    const found = await prisma.auctionImage.findMany({
      where: { id: { in: imageIds }, auctionId: null },
      select: { id: true },
    });
    if (found.length !== imageIds.length) {
      return NextResponse.json(
        {
          error:
            "Některé nahrané fotky už nejsou platné. Nahrajte je prosím znovu.",
        },
        { status: 400 },
      );
    }
  }

  const storedPaths = imageIds.map(storedImagePath);
  const displayUrls =
    storedPaths.length > 0 ? storedPaths : externalUrls;

  const auction = await prisma.$transaction(async (tx) => {
    const created = await tx.auction.create({
      data: {
        title: d.title,
        description: d.description,
        category: d.category,
        condition: d.condition,
        imageUrl: displayUrls[0] ?? null,
        imageUrls: displayUrls,
        startingPrice: d.startingPrice,
        currentPrice: d.startingPrice,
        endsAt: new Date(Date.now() + d.durationHours * 3600000),
      },
    });

    if (imageIds.length > 0) {
      await Promise.all(
        imageIds.map((id, index) =>
          tx.auctionImage.update({
            where: { id },
            data: { auctionId: created.id, sortOrder: index },
          }),
        ),
      );
    }

    return tx.auction.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        images: { select: { id: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  });

  return NextResponse.json({ auction }, { status: 201 });
}
