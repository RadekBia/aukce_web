import sharp from "sharp";

/** Longest edge after resize (px). */
export const IMAGE_MAX_EDGE = 1600;
/** JPEG/WebP quality. */
export const IMAGE_QUALITY = 80;
/** Max stored size after compression. */
export const IMAGE_MAX_STORED_BYTES = 2 * 1024 * 1024;
/** Max raw upload before compression (single file). */
export const IMAGE_MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/**
 * Resize (max edge 1600), convert to WebP q80, strip metadata/EXIF
 * (auto-orient first). Same result on every browser — server-side sharp.
 */
export async function compressAuctionImage(
  input: Buffer,
): Promise<{ data: Buffer; mimeType: "image/webp" }> {
  const data = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: IMAGE_MAX_EDGE,
      height: IMAGE_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_QUALITY, effort: 4 })
    .toBuffer();

  return { data, mimeType: "image/webp" };
}
