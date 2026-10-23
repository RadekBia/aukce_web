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
  sellerFirstName: z.string().trim().min(1).max(40).optional(),
  sellerLastName: z.string().trim().min(1).max(40).optional(),
  endsAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  status: z.enum(STATUSES),
  startingPrice: z.number().int().positive(),
  currentPrice: z.number().int().positive(),
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

  const existing = await prisma.auction.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Aukce nenalezena." }, { status: 404 });
  }

  const auction = await prisma.auction.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description,
      category: d.category,
      condition: d.condition,
      endsAt,
      status: d.status,
      startingPrice: d.startingPrice,
      currentPrice: d.currentPrice,
      ...(d.sellerFirstName !== undefined
        ? { sellerFirstName: d.sellerFirstName }
        : {}),
      ...(d.sellerLastName !== undefined
        ? { sellerLastName: d.sellerLastName }
        : {}),
    },
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
