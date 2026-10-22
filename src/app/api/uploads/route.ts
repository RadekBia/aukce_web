import { NextResponse } from "next/server";
import {
  compressAuctionImage,
  IMAGE_MAX_STORED_BYTES,
  IMAGE_MAX_UPLOAD_BYTES,
} from "@/lib/compress-image";
import { storedImagePath } from "@/lib/auction-images";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Store one compressed image in Neon (bytea). Call once per file. */
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
  if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `Soubor „${file.name}“ je příliš velký na nahrání (max. 12 MB před kompresí).`,
      },
      { status: 400 },
    );
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    const { data, mimeType } = await compressAuctionImage(raw);

    if (data.length > IMAGE_MAX_STORED_BYTES) {
      return NextResponse.json(
        {
          error: `Fotka „${file.name}“ je i po kompresi větší než 2 MB. Zkuste jednodušší / menší snímek.`,
        },
        { status: 400 },
      );
    }

    const sortRaw = form.get("sortOrder");
    const sortOrder =
      typeof sortRaw === "string" && Number.isFinite(Number(sortRaw))
        ? Number(sortRaw)
        : 0;

    const row = await prisma.auctionImage.create({
      data: {
        mimeType,
        data: new Uint8Array(data),
        sortOrder,
        auctionId: null,
      },
    });

    const url = storedImagePath(row.id);
    return NextResponse.json({
      id: row.id,
      url,
      urls: [url],
      bytes: data.length,
    });
  } catch (err) {
    console.error("neon image upload failed", err);
    return NextResponse.json(
      {
        error:
          "Zpracování nebo uložení fotky selhalo. Zkuste jiný soubor, nebo vložte URL obrázku.",
      },
      { status: 502 },
    );
  }
}
