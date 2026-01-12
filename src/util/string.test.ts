import { describe, it, expect } from "vitest";
import { sanitizeArtistName } from "./string";

describe("sanitizeArtistName", () => {
  it("should remove parentheses from artist name", () => {
    expect(sanitizeArtistName("Artist (2)")).toBe("Artist ");
  });

  it("should remove numbers from artist name", () => {
    expect(sanitizeArtistName("Artist123")).toBe("Artist");
  });

  it("should remove both parentheses and numbers", () => {
    expect(sanitizeArtistName("The Beatles (4)")).toBe("The Beatles ");
  });

  it("should return unchanged string if no parentheses or numbers", () => {
    expect(sanitizeArtistName("Pink Floyd")).toBe("Pink Floyd");
  });

  it("should handle empty string", () => {
    expect(sanitizeArtistName("")).toBe("");
  });

  it("should handle string with only numbers and parentheses", () => {
    expect(sanitizeArtistName("(123)")).toBe("");
  });

  it("should handle multiple parentheses groups", () => {
    expect(sanitizeArtistName("Artist (1) (2)")).toBe("Artist  ");
  });
});
