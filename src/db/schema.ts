import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const albums = sqliteTable("albums", {
  id: integer("id").primaryKey(),
  title: text("title"),
  year: text("year"),
  genres: text("genres"),
  styles: text("styles"),
  discogsId: integer("discogs_id"),
  imageUrl: text("image_url"),
  deletedAt: integer("deleted_at"),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id),
});

export const artists = sqliteTable("artists", {
  id: integer("id").primaryKey(),
  name: text("name"),
  deletedAt: integer("deleted_at"),
  discogsId: integer("discogs_id"),
  imageUrl: text("image_url"),
});

export const tracks = sqliteTable("tracks", {
  id: integer("id").primaryKey(),
  title: text("title"),
  duration: text("duration"),
  deletedAt: integer("deleted_at"),
  albumId: integer("album_id")
    .notNull()
    .references(() => albums.id),
});

// Inferred types from schema
export type Album = InferSelectModel<typeof albums>;
export type AlbumInsert = InferInsertModel<typeof albums>;
export type Artist = InferSelectModel<typeof artists>;
export type ArtistInsert = InferInsertModel<typeof artists>;
export type Track = InferSelectModel<typeof tracks>;
export type TrackInsert = InferInsertModel<typeof tracks>;
