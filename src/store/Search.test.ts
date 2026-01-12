import { describe, it, expect, beforeEach } from "vitest";
import { searchState, searchQuery, searchStateDefault } from "./Search";

describe("Search Store", () => {
  beforeEach(() => {
    searchState.set(searchStateDefault);
    searchQuery.set("");
  });

  describe("searchStateDefault", () => {
    it("should have empty results array", () => {
      expect(searchStateDefault.results).toEqual([]);
    });

    it("should have default pagination values", () => {
      expect(searchStateDefault.pagination).toEqual({
        items: 0,
        page: 0,
        pages: 0,
        per_page: 0,
        urls: {
          last: "",
          next: "",
        },
      });
    });
  });

  describe("searchState", () => {
    it("should initialize with default state", () => {
      expect(searchState.get()).toEqual(searchStateDefault);
    });

    it("should update results", () => {
      const newResults: [
        {
          id: number;
          type: string;
          cover_image: string;
          title: string;
          year: string;
          genre: [string];
          format: [string];
        }
      ] = [
        {
          id: 1,
          type: "master",
          cover_image: "http://example.com/image.jpg",
          title: "Test Album",
          year: "2023",
          genre: ["Rock"],
          format: ["Vinyl"],
        },
      ];

      searchState.setKey("results", newResults);
      expect(searchState.get().results).toEqual(newResults);
    });

    it("should update pagination", () => {
      const newPagination = {
        items: 100,
        page: 1,
        pages: 5,
        per_page: 20,
        urls: {
          last: "http://example.com/last",
          next: "http://example.com/next",
        },
      };

      searchState.setKey("pagination", newPagination);
      expect(searchState.get().pagination).toEqual(newPagination);
    });

    it("should replace entire state", () => {
      const newState = {
        results: [
          {
            id: 2,
            type: "release",
            cover_image: "http://example.com/cover.jpg",
            title: "Another Album",
          },
        ] as [{ id: number; type: string; cover_image: string; title: string }],
        pagination: {
          items: 50,
          page: 2,
          pages: 3,
          per_page: 20,
          urls: {
            last: "http://example.com/last2",
            next: "http://example.com/next2",
          },
        },
      };

      searchState.set(newState);
      expect(searchState.get()).toEqual(newState);
    });
  });

  describe("searchQuery", () => {
    it("should initialize with empty string", () => {
      expect(searchQuery.get()).toBe("");
    });

    it("should update query value", () => {
      searchQuery.set("test query");
      expect(searchQuery.get()).toBe("test query");
    });

    it("should handle special characters", () => {
      searchQuery.set("artist & album (2023)");
      expect(searchQuery.get()).toBe("artist & album (2023)");
    });
  });
});
