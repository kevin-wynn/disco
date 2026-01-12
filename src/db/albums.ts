import type { Album, DiscogsArtist, Track } from "../types/album";
import { db } from "./";
import { albums, artists, tracks } from "./schema";
import { eq } from "drizzle-orm";

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
      // use this id
      album.artistId = foundArtist[0].id;
    } else {
      // insert it
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
