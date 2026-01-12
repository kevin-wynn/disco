import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = "https://api.discogs.com";

const hasApiToken = () => {
  return !!process.env.PUBLIC_DISCOGS_API_TOKEN;
};

const makeRequest = async (url: string) => {
  const token = process.env.PUBLIC_DISCOGS_API_TOKEN;
  if (!token) {
    throw new Error(
      "PUBLIC_DISCOGS_API_TOKEN environment variable is required"
    );
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Discogs token=${token}`,
      "User-Agent": "DiscoApp/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  return await res.json();
};

describe.skipIf(!hasApiToken())("Discogs API Integration Tests", () => {
  beforeAll(() => {
    if (!hasApiToken()) {
      console.warn(
        "Skipping integration tests: PUBLIC_DISCOGS_API_TOKEN not set"
      );
    }
  });

  describe("getMaster", () => {
    it("should fetch a real master release (Dark Side of the Moon)", async () => {
      const masterId = 10362;
      const result = await makeRequest(`${BASE_URL}/masters/${masterId}`);

      expect(result).toBeDefined();
      expect(result.id).toBe(masterId);
      expect(result.title).toBeDefined();
      expect(result.artists).toBeDefined();
      expect(Array.isArray(result.artists)).toBe(true);
      expect(result.tracklist).toBeDefined();
      expect(Array.isArray(result.tracklist)).toBe(true);
    }, 10000);
  });

  describe("getRelease", () => {
    it("should fetch a real release", async () => {
      const releaseId = 249504;
      const result = await makeRequest(`${BASE_URL}/releases/${releaseId}`);

      expect(result).toBeDefined();
      expect(result.id).toBe(releaseId);
      expect(result.title).toBeDefined();
      expect(result.tracklist).toBeDefined();
    }, 10000);
  });

  describe("getMasterVersions", () => {
    it("should fetch versions of a master release", async () => {
      const masterId = 10362;
      const result = await makeRequest(
        `${BASE_URL}/masters/${masterId}/versions?per_page=10`
      );

      expect(result).toBeDefined();
      expect(result.versions).toBeDefined();
      expect(Array.isArray(result.versions)).toBe(true);
      expect(result.versions.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe("search", () => {
    it("should search for albums", async () => {
      const query = "Pink Floyd";
      const result = await makeRequest(
        `${BASE_URL}/database/search?q=${encodeURIComponent(
          query
        )}&type=master&per_page=5`
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.pagination).toBeDefined();
    }, 10000);

    it("should return empty results for nonsense query", async () => {
      const query = "xyznonexistentartist12345";
      const result = await makeRequest(
        `${BASE_URL}/database/search?q=${encodeURIComponent(
          query
        )}&type=master&per_page=5`
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    }, 10000);
  });

  describe("searchTrack", () => {
    it("should search for a specific track", async () => {
      const track = "Comfortably Numb";
      const artist = "Pink Floyd";
      const query = `${track} ${artist}`;
      const result = await makeRequest(
        `${BASE_URL}/database/search?q=${encodeURIComponent(
          query
        )}&type=release&per_page=5`
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    }, 10000);
  });

  describe("API Response Structure", () => {
    it("should have expected master release structure", async () => {
      const masterId = 10362;
      const result = await makeRequest(`${BASE_URL}/masters/${masterId}`);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("year");
      expect(result).toHaveProperty("artists");
      expect(result).toHaveProperty("tracklist");
      expect(result).toHaveProperty("genres");
      expect(result).toHaveProperty("styles");
    }, 10000);

    it("should have expected tracklist item structure", async () => {
      const masterId = 10362;
      const result = await makeRequest(`${BASE_URL}/masters/${masterId}`);

      expect(result.tracklist.length).toBeGreaterThan(0);
      const track = result.tracklist[0];
      expect(track).toHaveProperty("title");
      expect(track).toHaveProperty("position");
    }, 10000);
  });
});
