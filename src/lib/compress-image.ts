import sharp from "sharp";

/** Longest edge after resize (px). */
export const IMAGE_MAX_EDGE = 1600;
/** JPEG/WebP quality. */
export const IMAGE_QUALITY = 80;
/** Max stored size after compression. */
export const IMAGE_MAX_STORED_BYTES = 2 * 1024 * 1024;

/**
 * Server second-pass: resize (max edge 1600), WebP q80, strip EXIF after
 * auto-orient. Browser already compresses large (≤20 MB) originals first.
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
