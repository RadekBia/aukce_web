import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminConfigured, isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  firstName: z.string().max(40),
  lastName: z.string().max(40),
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

/** Set winner override, or clear it when both names are empty. */
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
      { error: "Neplatné jméno nebo příjmení vítěze." },
      { status: 400 },
    );
  }

  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();
  const clear = !firstName && !lastName;

  try {
    const auction = await prisma.auction.update({
      where: { id },
      data: {
        winnerFirstName: clear ? null : firstName,
        winnerLastName: clear ? null : lastName,
      },
      select: {
        id: true,
        title: true,
        winnerFirstName: true,
        winnerLastName: true,
      },
    });
    return NextResponse.json({
      ok: true,
      cleared: clear,
      auction,
    });
  } catch {
    return NextResponse.json(
      { error: "Aukce nenalezena nebo vítěze nelze uložit." },
      { status: 404 },
    );
  }
}
