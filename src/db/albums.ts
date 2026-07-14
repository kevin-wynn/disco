import { eq } from "drizzle-orm";
import type { Album, DiscogsArtist, Track } from "../types/album";
import { db } from "./";
import { albums, artists, tracks } from "./schema";

export const saveAlbum = async ({
  album,
  albumTracks,
  albumArtist,
}: {
  album: Album;
  albumTracks: [Track];
  albumArtist: [DiscogsArtist];
}) => {
  // TODO: need to make this relation many to one instead of one to one for artists
  for await (const artist of albumArtist) {
    const foundArtist = await db
      .select()
      .from(artists)
      .where(eq(artists.discogsId, artist.id || 0));

    if (foundArtist.length) {
      album.artistId = foundArtist[0].id;
    } else {
      const insertedArtist = await db.insert(artists).values({
        name: artist.name,
        imageUrl: artist.thumbnail_url,
        discogsId: artist.id,
      });

      album.artistId = insertedArtist.lastInsertRowid as number;
    }
  }

  const id = await db
    .insert(albums)
    .values(album)
    .returning({ insertedId: albums.id });

  for await (const track of albumTracks) {
    const trackWithAlbum = { ...track, albumId: id[0].insertedId };
    await db.insert(tracks).values(trackWithAlbum);
  }

  return id[0].insertedId;
};

export const updateTrackDuration = async ({
  trackId,
  duration,
}: {
  trackId: number;
  duration: string;
}) => {
  const result = await db
    .update(tracks)
    .set({ duration })
    .where(eq(tracks.id, trackId));

  return result.changes > 0;
};

export const deleteAlbum = async ({ albumId }: { albumId: number }) => {
  // Delete tracks first (foreign key constraint)
  await db.delete(tracks).where(eq(tracks.albumId, albumId));

  const result = await db.delete(albums).where(eq(albums.id, albumId));

  return result.changes > 0;
};

export const updateArtistDetails = async ({
  artistId,
  artistData,
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
}) => {
  const updateData: any = {};

  if (artistData.profile !== undefined) updateData.profile = artistData.profile;
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

  return result.changes > 0;
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
