import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

vi.mock("./", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        where: mockWhere,
      }),
    }),
    insert: (table: unknown) => ({
      values: (data: unknown) => ({
        returning: mockReturning,
      }),
    }),
  },
}));

vi.mock("./schema", () => ({
  albums: { id: "id", title: "title" },
  artists: { id: "id", name: "name", discogsId: "discogs_id" },
  tracks: { id: "id", title: "title", albumId: "album_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

import { saveAlbum } from "./albums";
import type { Album, DiscogsArtist, Track } from "../types/album";

describe("saveAlbum", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should save a new album with new artist", async () => {
    mockWhere.mockResolvedValueOnce([]);
    mockReturning.mockResolvedValueOnce([{ insertedId: 1 }]);

    const album: Album = {
      title: "Test Album",
      year: "2020",
      discogsId: 12345,
      genres: "Rock",
      styles: "Alternative",
      imageUrl: "http://example.com/image.jpg",
      artistId: 0,
    };

    const albumTracks: [Track] = [
      {
        title: "Track 1",
        duration: "3:45",
        albumId: 0,
      },
    ];

    const albumArtist: [DiscogsArtist] = [
      {
        id: 100,
        name: "Test Artist",
        thumbnail_url: "http://example.com/artist.jpg",
      },
    ];

    const result = await saveAlbum({ album, albumTracks, albumArtist });

    expect(result).toBe(1);
  });

  it("should use existing artist if found", async () => {
    mockWhere.mockResolvedValueOnce([{ id: 5, name: "Existing Artist" }]);
    mockReturning.mockResolvedValueOnce([{ insertedId: 2 }]);

    const album: Album = {
      title: "Another Album",
      year: "2021",
      discogsId: 67890,
      genres: "Pop",
      styles: "Synth-pop",
      imageUrl: "http://example.com/image2.jpg",
      artistId: 0,
    };

    const albumTracks: [Track] = [
      {
        title: "Track A",
        duration: "4:00",
        albumId: 0,
      },
    ];

    const albumArtist: [DiscogsArtist] = [
      {
        id: 200,
        name: "Existing Artist",
        thumbnail_url: "http://example.com/artist2.jpg",
      },
    ];

    const result = await saveAlbum({ album, albumTracks, albumArtist });

    expect(album.artistId).toBe(5);
    expect(result).toBe(2);
  });

  it("should save multiple tracks for an album", async () => {
    mockWhere.mockResolvedValueOnce([]);
    mockReturning.mockResolvedValueOnce([{ insertedId: 3 }]);

    const album: Album = {
      title: "Multi-Track Album",
      year: "2022",
      discogsId: 11111,
      genres: "Electronic",
      styles: "House",
      imageUrl: "http://example.com/image3.jpg",
      artistId: 0,
    };

    const albumTracks: [Track] = [
      { title: "Track 1", duration: "3:00", albumId: 0 },
    ];

    const albumArtist: [DiscogsArtist] = [
      {
        id: 300,
        name: "DJ Test",
        thumbnail_url: "http://example.com/dj.jpg",
      },
    ];

    const result = await saveAlbum({ album, albumTracks, albumArtist });

    expect(result).toBe(3);
  });
});
