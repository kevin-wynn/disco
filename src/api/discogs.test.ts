import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getMaster,
  getRelease,
  getMasterVersions,
  search,
  searchTrack,
} from "./discogs";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.stubGlobal("import", {
  meta: {
    env: {
      PUBLIC_DISCOGS_API_TOKEN: "test-token",
    },
  },
});

describe("Discogs API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getMaster", () => {
    it("should fetch master release by id", async () => {
      const mockMasterData = {
        id: 12345,
        title: "Test Album",
        year: 2020,
        artists: [{ name: "Test Artist" }],
        tracklist: [{ title: "Track 1", duration: "3:45" }],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockMasterData),
      });

      const result = await getMaster({ id: 12345 });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.discogs.com/masters/12345",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Discogs token="),
          }),
        })
      );
      expect(result).toEqual(mockMasterData);
    });
  });

  describe("getRelease", () => {
    it("should fetch release by id", async () => {
      const mockReleaseData = {
        id: 67890,
        title: "Test Release",
        year: 2021,
        tracklist: [{ title: "Track 1", duration: "4:00" }],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockReleaseData),
      });

      const result = await getRelease({ id: 67890 });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.discogs.com/releases/67890",
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockReleaseData);
    });
  });

  describe("getMasterVersions", () => {
    it("should fetch master versions by id", async () => {
      const mockVersionsData = {
        versions: [
          { id: 1, title: "Version 1" },
          { id: 2, title: "Version 2" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockVersionsData),
      });

      const result = await getMasterVersions({ id: 12345 });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.discogs.com/masters/12345/versions?per_page=10",
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockVersionsData);
    });
  });

  describe("search", () => {
    it("should search for albums by query", async () => {
      const mockSearchResults = {
        results: [
          { id: 1, title: "Result 1", type: "master" },
          { id: 2, title: "Result 2", type: "master" },
        ],
        pagination: { pages: 1, items: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockSearchResults),
      });

      const result = await search({ query: "test query" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://api.discogs.com/database/search?q=test query"
        ),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe("searchTrack", () => {
    it("should search for track without artist", async () => {
      const mockSearchResults = {
        results: [{ id: 1, title: "Track Result" }],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockSearchResults),
      });

      const result = await searchTrack({ track: "test track" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("q=test%20track"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockSearchResults);
    });

    it("should search for track with artist", async () => {
      const mockSearchResults = {
        results: [{ id: 1, title: "Track Result" }],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockSearchResults),
      });

      const result = await searchTrack({
        track: "test track",
        artist: "test artist",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("q=test%20track%20test%20artist"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockSearchResults);
    });

    it("should include per_page and type parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [] }),
      });

      await searchTrack({ track: "test" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("type=release"),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("per_page=5"),
        expect.anything()
      );
    });
  });
});
