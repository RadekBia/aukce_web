/** Public URL for a Neon-stored auction photo. */
export function storedImagePath(id: string): string {
  return `/api/images/${id}`;
}

/**
 * Display list: prefer DB-backed `images`, else legacy imageUrls / imageUrl
 * (external pasted links from before Neon storage).
 */
export function auctionImageList(auction: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  images?: { id: string }[] | null;
}): string[] {
  if (auction.images && auction.images.length > 0) {
    return auction.images.map((img) => storedImagePath(img.id));
  }
  const fromArray = (auction.imageUrls ?? []).filter(Boolean);
  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }
  if (auction.imageUrl) return [auction.imageUrl];
  return [];
}

export function coverImageUrl(auction: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  images?: { id: string }[] | null;
}): string | null {
  return auctionImageList(auction)[0] ?? null;
}
