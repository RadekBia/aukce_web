/** Client-only helpers — compress before POST so 20 MB originals fit under Vercel’s ~4.5 MB body limit. */

export const BROWSER_MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
/** Stay under Vercel serverless body limit (~4.5 MB). */
export const BROWSER_MAX_POST_BYTES = 4 * 1024 * 1024;
export const BROWSER_QUALITY = 0.8;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Komprese fotky v prohlížeči selhala."));
      },
      type,
      quality,
    );
  });
}

/**
 * Encode WebP (fallback JPEG) at quality ~80 without downscaling by pixels.
 * Throws Error with Czech message on failure / oversize.
 */
export async function compressImageInBrowser(file: File): Promise<File> {
  if (file.size > BROWSER_MAX_ORIGINAL_BYTES) {
    throw new Error(
      `Soubor „${file.name}“ je větší než 20 MB. Vyberte menší fotku.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      // honour EXIF orientation when the browser supports it
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    throw new Error(
      `Soubor „${file.name}“ nelze načíst jako obrázek (JPEG, PNG nebo WebP).`,
    );
  }

  const width = Math.max(1, bitmap.width);
  const height = Math.max(1, bitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Komprese fotky v prohlížeči selhala.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob: Blob;
  try {
    blob = await canvasToBlob(canvas, "image/webp", BROWSER_QUALITY);
  } catch {
    blob = await canvasToBlob(canvas, "image/jpeg", BROWSER_QUALITY);
  }

  if (blob.size > BROWSER_MAX_POST_BYTES) {
    throw new Error(
      `Fotka „${file.name}“ je i po kompresi příliš velká na nahrání (limit serveru cca 4,5 MB). Zkuste jednodušší snímek.`,
    );
  }

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}
