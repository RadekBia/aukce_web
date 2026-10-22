/** Normalize legacy imageUrl + imageUrls into a display list (deduped). */
export function auctionImageList(auction: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string[] {
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
}): string | null {
  return auctionImageList(auction)[0] ?? null;
}
