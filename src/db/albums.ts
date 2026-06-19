import type { LoggySpan } from "@loggydev/loggy-node/dist/tracing/span";
import { eq } from "drizzle-orm";
import type { Album, DiscogsArtist, Track } from "../types/album";
import { apiTracer, loggy } from "../util/loggy";
import { db } from "./";
import { albums, artists, tracks } from "./schema";

export const saveAlbum = async ({
  album,
  albumTracks,
  albumArtist,
  parentSpan,
}: {
  album: Album;
  albumTracks: [Track];
  albumArtist: [DiscogsArtist];
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.save_album", {
    parent: parentSpan?.context,
    attributes: { "album.title": album.title },
  });
  loggy.log(`Saving album: ${album.title}`, {
    action: "save_album",
    title: album.title,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });
  // TODO: need to make this relation many to one instead of one to one for artists
  const artistSpan = apiTracer.startSpan("db.process_artists", {
    parent: span.context,
    attributes: { "artist.count": albumArtist.length },
  });
  for await (const artist of albumArtist) {
    const foundArtist = await db
      .select()
      .from(artists)
      .where(eq(artists.discogsId, artist.id || 0));

    if (foundArtist.length) {
      // use this id
      loggy.log(`Found existing artist: ${artist.name}`, {
        action: "artist_lookup",
        artistName: artist.name,
        artistId: foundArtist[0].id,
        found: true,
        traceId: span.context.traceId,
        spanId: span.context.spanId,
      });
      album.artistId = foundArtist[0].id;
    } else {
      // insert it
      loggy.info(`Inserting new artist: ${artist.name}`, {
        action: "artist_insert",
        artistName: artist.name,
        traceId: span.context.traceId,
        spanId: span.context.spanId,
      });
      const insertedArtist = await db.insert(artists).values({
        name: artist.name,
        imageUrl: artist.thumbnail_url,
        discogsId: artist.id,
      });

      album.artistId = insertedArtist.lastInsertRowid as number;
    }
  }
  artistSpan.setStatus("ok");
  artistSpan.end();

  const albumInsertSpan = apiTracer.startSpan("db.insert_album", {
    parent: span.context,
    attributes: { "album.title": album.title },
  });
  loggy.log(`Inserting album into database`, {
    action: "album_insert",
    title: album.title,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });
  const id = await db
    .insert(albums)
    .values(album)
    .returning({ insertedId: albums.id });
  loggy.info(`Album inserted`, {
    action: "album_insert",
    albumId: id[0].insertedId,
    title: album.title,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });
  albumInsertSpan.setAttribute("album.id", id[0].insertedId);
  albumInsertSpan.setStatus("ok");
  albumInsertSpan.end();

  const tracksSpan = apiTracer.startSpan("db.insert_tracks", {
    parent: span.context,
    attributes: {
      "track.count": albumTracks.length,
      "album.id": id[0].insertedId,
    },
  });
  loggy.log(`Inserting tracks`, {
    action: "tracks_insert",
    trackCount: albumTracks.length,
    albumId: id[0].insertedId,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });
  for await (const track of albumTracks) {
    const trackWithAlbum = { ...track, albumId: id[0].insertedId };
    await db.insert(tracks).values(trackWithAlbum);
  }
  tracksSpan.setStatus("ok");
  tracksSpan.end();

  loggy.info(`Successfully saved album: ${album.title}`, {
    action: "save_album_complete",
    title: album.title,
    albumId: id[0].insertedId,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });
  span.setStatus("ok");
  span.end();
  return id[0].insertedId;
};

export const updateTrackDuration = async ({
  trackId,
  duration,
  parentSpan,
}: {
  trackId: number;
  duration: string;
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.update_track_duration", {
    parent: parentSpan?.context,
    attributes: { "track.id": trackId, "track.duration": duration },
  });

  loggy.log(`Updating track duration: ${trackId}`, {
    action: "update_track_duration",
    trackId,
    duration,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    const result = await db
      .update(tracks)
      .set({ duration })
      .where(eq(tracks.id, trackId));

    span.setStatus("ok");
    span.end();

    loggy.info(`Successfully updated track duration: ${trackId}`, {
      action: "update_track_duration_complete",
      trackId,
      duration,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    return result.changes > 0;
  } catch (error) {
    loggy.error(`Error updating track duration: ${trackId}`, {
      action: "update_track_duration_error",
      trackId,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    throw error;
  }
};

export const deleteAlbum = async ({
  albumId,
  parentSpan,
}: {
  albumId: number;
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.delete_album", {
    parent: parentSpan?.context,
    attributes: { "album.id": albumId },
  });

  loggy.log(`Deleting album: ${albumId}`, {
    action: "delete_album",
    albumId,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    // Delete tracks first (foreign key constraint)
    const tracksSpan = apiTracer.startSpan("db.delete_tracks", {
      parent: span.context,
      attributes: { "album.id": albumId },
    });

    await db.delete(tracks).where(eq(tracks.albumId, albumId));

    tracksSpan.setStatus("ok");
    tracksSpan.end();

    loggy.info(`Deleted tracks for album: ${albumId}`, {
      action: "delete_tracks",
      albumId,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    // Delete the album
    const albumSpan = apiTracer.startSpan("db.delete_album_record", {
      parent: span.context,
      attributes: { "album.id": albumId },
    });

    const result = await db.delete(albums).where(eq(albums.id, albumId));

    albumSpan.setStatus("ok");
    albumSpan.end();

    loggy.info(`Successfully deleted album: ${albumId}`, {
      action: "delete_album_complete",
      albumId,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("ok");
    span.end();

    return result.changes > 0;
  } catch (error) {
    loggy.error(`Error deleting album: ${albumId}`, {
      action: "delete_album_error",
      albumId,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    throw error;
  }
};

export const updateArtistDetails = async ({
  artistId,
  artistData,
  parentSpan,
}: {
  artistId: number;
  artistData: {
    profile?: string;
    urls?: string[];
    nameVariations?: string[];
    members?: any[];
    dataQuality?: string;
    imageUrl?: string;
  };
  parentSpan?: LoggySpan;
}) => {
  const span = apiTracer.startSpan("db.update_artist_details", {
    parent: parentSpan?.context,
    attributes: { "artist.id": artistId },
  });

  loggy.log(`Updating artist details: ${artistId}`, {
    action: "update_artist_details",
    artistId,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    const updateData: any = {};

    if (artistData.profile !== undefined)
      updateData.profile = artistData.profile;
    if (artistData.urls !== undefined)
      updateData.urls = JSON.stringify(artistData.urls);
    if (artistData.nameVariations !== undefined)
      updateData.nameVariations = JSON.stringify(artistData.nameVariations);
    if (artistData.members !== undefined)
      updateData.members = JSON.stringify(artistData.members);
    if (artistData.dataQuality !== undefined)
      updateData.dataQuality = artistData.dataQuality;
    if (artistData.imageUrl !== undefined)
      updateData.imageUrl = artistData.imageUrl;

    const result = await db
      .update(artists)
      .set(updateData)
      .where(eq(artists.id, artistId));

    span.setStatus("ok");
    span.end();

    loggy.info(`Successfully updated artist details: ${artistId}`, {
      action: "update_artist_details_complete",
      artistId,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    return result.changes > 0;
  } catch (error) {
    loggy.error(`Error updating artist details: ${artistId}`, {
      action: "update_artist_details_error",
      artistId,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    throw error;
  }
};

export const getAlbumsByArtist = async (artistId: number) => {
  try {
    const artistAlbums = await db
      .select()
      .from(albums)
      .where(eq(albums.artistId, artistId))
      .orderBy(albums.year);

    return artistAlbums;
  } catch (error) {
    console.error("Error getting albums by artist:", error);
    return [];
  }
};
