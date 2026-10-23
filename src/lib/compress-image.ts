import sharp from "sharp";

/** JPEG/WebP quality. */
export const IMAGE_QUALITY = 80;
/** Max stored size after compression. */
export const IMAGE_MAX_STORED_BYTES = 2 * 1024 * 1024;

/**
 * Server second-pass: WebP q80, strip EXIF after auto-orient.
 * Does not downscale by pixel dimensions.
 * Browser already compresses large (≤20 MB) originals first.
 */
export async function compressAuctionImage(
  input: Buffer,
): Promise<{ data: Buffer; mimeType: "image/webp" }> {
  const data = await sharp(input, { failOn: "none" })
    .rotate()
    .webp({ quality: IMAGE_QUALITY, effort: 4 })
    .toBuffer();

  return { data, mimeType: "image/webp" };
}
