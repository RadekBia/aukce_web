import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storedImagePath } from "@/lib/auction-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024; // ~2 MB per file
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Store one image in Neon (bytea). Call once per file to stay under body limits. */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Neplatná data formuláře." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Vyberte obrázek (JPEG, PNG nebo WebP)." },
      { status: 400 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      {
        error: `Soubor „${file.name}“ má nepodporovaný formát. Povolené: JPEG, PNG, WebP.`,
      },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Soubor „${file.name}“ je příliš velký (max. 2 MB na soubor).`,
      },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sortRaw = form.get("sortOrder");
    const sortOrder =
      typeof sortRaw === "string" && Number.isFinite(Number(sortRaw))
        ? Number(sortRaw)
        : 0;

    const row = await prisma.auctionImage.create({
      data: {
        mimeType: file.type,
        data: buffer,
        sortOrder,
        // Linked to an auction in POST /api/auctions via imageIds.
        auctionId: null,
      },
    });

    const url = storedImagePath(row.id);
    return NextResponse.json({
      id: row.id,
      url,
      urls: [url],
    });
  } catch (err) {
    console.error("neon image upload failed", err);
    return NextResponse.json(
      {
        error:
          "Uložení fotky do databáze selhalo. Zkuste menší soubor, nebo vložte URL obrázku.",
      },
      { status: 502 },
    );
  }
}
