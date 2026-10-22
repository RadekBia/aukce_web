import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  compressAuctionImage,
  IMAGE_MAX_STORED_BYTES,
} from "@/lib/compress-image";
import { storedImagePath } from "@/lib/auction-images";
import { isUnauthenticatedAuctionCreationEnabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Client should already compress; stay under Vercel ~4.5 MB body limit. */
const MAX_POST_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Store one image in Neon (bytea). Prefer browser-precompressed WebP/JPEG. */
export async function POST(req: Request) {
  const session = await auth();
  const allowAnon = isUnauthenticatedAuctionCreationEnabled();
  if (!session?.user && !allowAnon) {
    return NextResponse.json(
      {
        error:
          "Pro nahrání fotek se přihlaste přes Google (tlačítko v záhlaví).",
      },
      { status: 401 },
    );
  }

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
  if (file.size > MAX_POST_BYTES) {
    return NextResponse.json(
      {
        error: `Fotka „${file.name}“ je po kompresi stále příliš velká na nahrání (limit serveru cca 4,5 MB).`,
      },
      { status: 400 },
    );
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    // Second pass with sharp for consistent max-edge / WebP storage.
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
