import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isBlobUploadConfigured } from "@/lib/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4.5 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  if (!isBlobUploadConfigured()) {
    return NextResponse.json(
      {
        error:
          "Nahrávání ze souboru není připravené. Ve Vercelu: Storage → Blob → Create / Connect to project (doplní se BLOB_READ_WRITE_TOKEN). Do té doby můžete použít záložní pole s URL obrázku.",
        blobConfigured: false,
      },
      { status: 503 },
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

  const files = [
    ...form.getAll("files"),
    ...form.getAll("file"),
  ].filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Vyberte alespoň jeden obrázek (JPEG, PNG nebo WebP)." },
      { status: 400 },
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Najednou lze nahrát nejvýše ${MAX_FILES} příloh.` },
      { status: 400 },
    );
  }

  for (const file of files) {
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
          error: `Soubor „${file.name}“ je příliš velký (max. 4,5 MB na soubor).`,
        },
        { status: 400 },
      );
    }
  }

  const urls: string[] = [];
  try {
    for (const file of files) {
      const safeName =
        file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "photo";
      const pathname = `auctions/${Date.now()}-${safeName}`;
      const blob = await put(pathname, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: true,
      });
      urls.push(blob.url);
    }
  } catch (err) {
    console.error("blob upload failed", err);
    return NextResponse.json(
      {
        error:
          "Nahrání do Vercel Blob selhalo. Zkuste to znovu, nebo vložte URL obrázku ručně.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    urls,
    url: urls[0] ?? null,
  });
}
