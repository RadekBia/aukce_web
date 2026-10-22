import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminConfigured, isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES = ["DRAFT", "ACTIVE", "ENDED", "CANCELLED"] as const;

const updateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(10000),
  category: z.string().trim().min(2).max(60),
  condition: z.string().trim().min(2).max(40),
  endsAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  status: z.enum(STATUSES),
  startingPrice: z.number().int().positive().optional(),
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
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data aukce." }, { status: 400 });
  }

  const d = parsed.data;
  const endsAt = new Date(d.endsAt);
  if (Number.isNaN(endsAt.getTime())) {
    return NextResponse.json(
      { error: "Neplatný termín ukončení aukce." },
      { status: 400 },
    );
  }

  const existing = await prisma.auction.findUnique({
    where: { id },
    include: { _count: { select: { bids: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Aukce nenalezena." }, { status: 404 });
  }

  const hasBids = existing._count.bids > 0;
  if (hasBids && d.startingPrice !== undefined) {
    if (d.startingPrice !== existing.startingPrice) {
      return NextResponse.json(
        {
          error:
            "Vyvolávací cenu nelze měnit, protože aukce už má příhozy. Aktuální cena zůstává.",
        },
        { status: 400 },
      );
    }
  }

  const data: {
    title: string;
    description: string;
    category: string;
    condition: string;
    endsAt: Date;
    status: (typeof STATUSES)[number];
    startingPrice?: number;
    currentPrice?: number;
  } = {
    title: d.title,
    description: d.description,
    category: d.category,
    condition: d.condition,
    endsAt,
    status: d.status,
  };

  if (!hasBids && d.startingPrice !== undefined) {
    data.startingPrice = d.startingPrice;
    // No bids yet — keep currentPrice in sync with starting price.
    data.currentPrice = d.startingPrice;
  }

  const auction = await prisma.auction.update({
    where: { id },
    data,
    include: { _count: { select: { bids: true } } },
  });

  return NextResponse.json({
    ok: true,
    auction: {
      id: auction.id,
      title: auction.title,
      bidCount: auction._count.bids,
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

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
