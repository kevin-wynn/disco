import { eq } from "drizzle-orm";
import type { Album, DiscogsArtist } from "../types/album";
import { db } from "./";
import type { WishlistInsert } from "./schema";
import { wishlist } from "./schema";

export const addToWishlist = async ({
  album,
  albumArtist,
  notes,
}: {
  album: Album;
  albumArtist: [DiscogsArtist];
  notes?: string;
}) => {
  // DO NOT create album/artist/track records in the main collection
  // Wishlist should be completely separate
  const wishlistItem: WishlistInsert = {
    discogsId: album.discogsId!,
    title: album.title!,
    artist: albumArtist[0].name!,
    year: album.year,
    imageUrl: album.imageUrl,
    format: album.format,
    label: album.label,
    country: album.country,
    addedAt: Date.now(),
    notes,
  };

  const result = await db.insert(wishlist).values(wishlistItem);

  return result.lastInsertRowid as number;
};

export const getWishlist = async () => {
  return await db.select().from(wishlist).orderBy(wishlist.addedAt);
};

export const removeFromWishlist = async ({
  wishlistId,
}: {
  wishlistId: number;
}) => {
  const result = await db.delete(wishlist).where(eq(wishlist.id, wishlistId));

  return result.changes > 0;
};

export const updateWishlistNotes = async ({
  wishlistId,
  notes,
}: {
  wishlistId: number;
  notes: string;
}) => {
  const result = await db
    .update(wishlist)
    .set({ notes })
    .where(eq(wishlist.id, wishlistId));

  return result.changes > 0;
};
