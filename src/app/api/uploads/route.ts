import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isBlobUploadConfigured } from "@/lib/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4.5 * 1024 * 1024; // stay under typical serverless body limits
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  if (!isBlobUploadConfigured()) {
    return NextResponse.json(
      {
        error:
          "Nahrávání souborů není připravené. Ve Vercelu otevřete Storage → Blob a připojte ho k projektu (token BLOB_READ_WRITE_TOKEN se doplní sám). Do té doby použijte pole s URL obrázku.",
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

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Vyberte obrázek (JPEG, PNG, WebP nebo GIF)." },
      { status: 400 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Povolené formáty: JPEG, PNG, WebP, GIF." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Soubor je příliš velký (max. cca 4,5 MB)." },
      { status: 400 },
    );
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "photo";
  const pathname = `auctions/${Date.now()}-${safeName}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
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
}
