import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  format: text("format"),
  country: text("country"),
  label: text("label"),
  releasedDate: text("released_date"),
  totalDuration: text("total_duration"),
  trackCount: integer("track_count"),
});

export const artists = sqliteTable("artists", {
  id: integer("id").primaryKey(),
  name: text("name"),
  deletedAt: integer("deleted_at"),
  discogsId: integer("discogs_id"),
  imageUrl: text("image_url"),
  profile: text("profile"),
  urls: text("urls"), // JSON array of URLs
  nameVariations: text("name_variations"), // JSON array of name variations
  members: text("members"), // JSON array of members
  dataQuality: text("data_quality"),
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

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  discogsApiToken: text("discogs_api_token"),
});

export const wishlist = sqliteTable("wishlist", {
  id: integer("id").primaryKey(),
  discogsId: integer("discogs_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  year: text("year"),
  imageUrl: text("image_url"),
  format: text("format"),
  label: text("label"),
  country: text("country"),
  addedAt: integer("added_at").notNull(),
  notes: text("notes"),
});

// Inferred types from schema
export type Album = InferSelectModel<typeof albums>;
export type AlbumInsert = InferInsertModel<typeof albums>;
export type Artist = InferSelectModel<typeof artists>;
export type ArtistInsert = InferInsertModel<typeof artists>;
export type Track = InferSelectModel<typeof tracks>;
export type TrackInsert = InferInsertModel<typeof tracks>;
export type Settings = InferSelectModel<typeof settings>;
export type SettingsInsert = InferInsertModel<typeof settings>;
export type Wishlist = InferSelectModel<typeof wishlist>;
export type WishlistInsert = InferInsertModel<typeof wishlist>;
