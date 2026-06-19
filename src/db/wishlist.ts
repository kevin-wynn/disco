import type { LoggySpan } from "@loggydev/loggy-node/dist/tracing/span";
import { eq } from "drizzle-orm";
import type { Album, DiscogsArtist, Track } from "../types/album";
import { apiTracer, loggy } from "../util/loggy";
import { db } from "./";
import type { WishlistInsert } from "./schema";
import { wishlist } from "./schema";

export const addToWishlist = async ({
  album,
  albumTracks,
  albumArtist,
  notes,
  parentSpan,
}: {
  album: Album;
  albumTracks: [Track];
  albumArtist: [DiscogsArtist];
  notes?: string;
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.add_to_wishlist", {
    parent: parentSpan?.context,
    attributes: { "album.title": album.title },
  });

  loggy.log(`Adding album to wishlist: ${album.title}`, {
    action: "add_to_wishlist",
    title: album.title,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    // DO NOT create album/artist/track records in the main collection
    // Wishlist should be completely separate

    // Add to wishlist with all the Discogs data directly
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

    loggy.info(`Successfully added album to wishlist: ${album.title}`, {
      action: "add_to_wishlist_complete",
      title: album.title,
      wishlistId: result.lastInsertRowid,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("ok");
    span.end();

    return result.lastInsertRowid as number;
  } catch (error) {
    loggy.error(`Error adding album to wishlist: ${album.title}`, {
      action: "add_to_wishlist_error",
      title: album.title,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    throw error;
  }
};

export const getWishlist = async ({
  parentSpan,
}: {
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.get_wishlist", {
    parent: parentSpan?.context,
  });

  loggy.log(`Getting wishlist items`, {
    action: "get_wishlist",
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    const items = await db.select().from(wishlist).orderBy(wishlist.addedAt);

    loggy.info(`Successfully retrieved wishlist items: ${items.length}`, {
      action: "get_wishlist_complete",
      itemCount: items.length,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("ok");
    span.end();

    return items;
  } catch (error) {
    loggy.error(`Error getting wishlist items`, {
      action: "get_wishlist_error",
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    throw error;
  }
};

export const removeFromWishlist = async ({
  wishlistId,
  parentSpan,
}: {
  wishlistId: number;
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.remove_from_wishlist", {
    parent: parentSpan?.context,
    attributes: { "wishlist.id": wishlistId },
  });

  loggy.log(`Removing item from wishlist: ${wishlistId}`, {
    action: "remove_from_wishlist",
    wishlistId,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    const result = await db.delete(wishlist).where(eq(wishlist.id, wishlistId));

    loggy.info(`Successfully removed item from wishlist: ${wishlistId}`, {
      action: "remove_from_wishlist_complete",
      wishlistId,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("ok");
    span.end();

    return result.changes > 0;
  } catch (error) {
    loggy.error(`Error removing item from wishlist: ${wishlistId}`, {
      action: "remove_from_wishlist_error",
      wishlistId,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    throw error;
  }
};

export const updateWishlistNotes = async ({
  wishlistId,
  notes,
  parentSpan,
}: {
  wishlistId: number;
  notes: string;
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.update_wishlist_notes", {
    parent: parentSpan?.context,
    attributes: { "wishlist.id": wishlistId },
  });

  loggy.log(`Updating wishlist notes: ${wishlistId}`, {
    action: "update_wishlist_notes",
    wishlistId,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    const result = await db
      .update(wishlist)
      .set({ notes })
      .where(eq(wishlist.id, wishlistId));

    loggy.info(`Successfully updated wishlist notes: ${wishlistId}`, {
      action: "update_wishlist_notes_complete",
      wishlistId,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("ok");
    span.end();

    return result.changes > 0;
  } catch (error) {
    loggy.error(`Error updating wishlist notes: ${wishlistId}`, {
      action: "update_wishlist_notes_error",
      wishlistId,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    throw error;
  }
};
