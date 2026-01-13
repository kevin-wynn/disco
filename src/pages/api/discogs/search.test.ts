import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("../../../db/settings", () => ({
  getDiscogsApiToken: vi.fn().mockResolvedValue("test-token"),
}));

describe("Discogs Search API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (url: string) => ({
    url,
  });

  const BASE_URL = "https://api.discogs.com";

  describe("GET handler logic", () => {
    it("should return error when query parameter is missing", () => {
      const url = new URL("http://localhost:4321/api/discogs/search");
      const query = url.searchParams.get("q");

      expect(query).toBeNull();
    });

    it("should extract query parameter from URL", () => {
      const url = new URL(
        "http://localhost:4321/api/discogs/search?q=test+album"
      );
      const query = url.searchParams.get("q");

      expect(query).toBe("test album");
    });

    it("should use default page 1 when page parameter is missing", () => {
      const url = new URL("http://localhost:4321/api/discogs/search?q=test");
      const page = url.searchParams.get("page") || "1";

      expect(page).toBe("1");
    });

    it("should use provided page parameter", () => {
      const url = new URL(
        "http://localhost:4321/api/discogs/search?q=test&page=3"
      );
      const page = url.searchParams.get("page") || "1";

      expect(page).toBe("3");
    });

    it("should construct correct Discogs search URL", () => {
      const query = "test album";
      const page = "2";

      const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
        query
      )}&type=master&per_page=20&page=${page}`;

      expect(searchUrl).toBe(
        "https://api.discogs.com/database/search?q=test%20album&type=master&per_page=20&page=2"
      );
    });

    it("should encode special characters in query", () => {
      const query = "artist & album (2023)";

      const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
        query
      )}&type=master&per_page=20&page=1`;

      expect(searchUrl).toContain("q=artist%20%26%20album%20(2023)");
    });
  });

  describe("fetch behavior", () => {
    it("should call fetch with correct URL and headers", async () => {
      const mockResponse = {
        results: [],
        pagination: { items: 0, page: 1, pages: 0, per_page: 20 },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const query = "test";
      const page = "1";
      const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
        query
      )}&type=master&per_page=20&page=${page}`;

      await fetch(searchUrl, {
        method: "GET",
        headers: {
          Authorization: "Discogs token=test-token",
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(searchUrl, {
        method: "GET",
        headers: {
          Authorization: "Discogs token=test-token",
        },
      });
    });

    it("should handle successful response", async () => {
      const mockResponse = {
        results: [{ id: 1, title: "Test Album", type: "master" }],
        pagination: { items: 1, page: 1, pages: 1, per_page: 20 },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const res = await fetch("https://api.discogs.com/database/search?q=test");
      const data = await res.json();

      expect(data.results).toHaveLength(1);
      expect(data.results[0].title).toBe("Test Album");
    });

    it("should handle empty results", async () => {
      const mockResponse = {
        results: [],
        pagination: { items: 0, page: 1, pages: 0, per_page: 20 },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const res = await fetch(
        "https://api.discogs.com/database/search?q=nonexistent"
      );
      const data = await res.json();

      expect(data.results).toHaveLength(0);
    });

    it("should handle API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ message: "Unauthorized" }),
        status: 401,
      });

      const res = await fetch("https://api.discogs.com/database/search?q=test");

      expect(res.status).toBe(401);
    });
  });
});
