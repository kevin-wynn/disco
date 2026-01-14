import type { Album, DiscogsArtist, Track } from "../types/album";
import { db } from "./";
import { albums, artists, tracks } from "./schema";
import { eq } from "drizzle-orm";
import { loggy } from "../util/loggy";

export const saveAlbum = async ({
  album,
  albumTracks,
  albumArtist,
}: {
  album: Album;
  albumTracks: [Track];
  albumArtist: [DiscogsArtist];
}) => {
  loggy.log(`Saving album: ${album.title}`, { action: "save_album", title: album.title });
  // TODO: need to make this relation many to one instead of one to one for artists
  for await (const artist of albumArtist) {
    const foundArtist = await db
      .select()
      .from(artists)
      .where(eq(artists.discogsId, artist.id || 0));

    if (foundArtist.length) {
      // use this id
      loggy.log(`Found existing artist: ${artist.name}`, { action: "artist_lookup", artistName: artist.name, artistId: foundArtist[0].id, found: true });
      album.artistId = foundArtist[0].id;
    } else {
      // insert it
      loggy.info(`Inserting new artist: ${artist.name}`, { action: "artist_insert", artistName: artist.name });
      const insertedArtist = await db.insert(artists).values({
        name: artist.name,
        imageUrl: artist.thumbnail_url,
        discogsId: artist.id,
      });

      album.artistId = insertedArtist.lastInsertRowid as number;
    }
  }

  loggy.log(`Inserting album into database`, { action: "album_insert", title: album.title });
  const id = await db
    .insert(albums)
    .values(album)
    .returning({ insertedId: albums.id });
  loggy.info(`Album inserted`, { action: "album_insert", albumId: id[0].insertedId, title: album.title });

  loggy.log(`Inserting tracks`, { action: "tracks_insert", trackCount: albumTracks.length, albumId: id[0].insertedId });
  for await (const track of albumTracks) {
    const trackWithAlbum = { ...track, albumId: id[0].insertedId };
    await db.insert(tracks).values(trackWithAlbum);
  }

  loggy.info(`Successfully saved album: ${album.title}`, { action: "save_album_complete", title: album.title, albumId: id[0].insertedId });
  return id[0].insertedId;
};
