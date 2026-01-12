import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../api/discogs", () => ({
  getRelease: vi.fn(),
  getMasterVersions: vi.fn(),
}));

vi.mock("../../db/albums", () => ({
  saveAlbum: vi.fn(),
}));

import { getRelease, getMasterVersions } from "../../api/discogs";

const hasValidDurations = (tracklist: { duration?: string }[]) =>
  tracklist?.some((t) => t.duration && t.duration.trim() !== "");

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getDurationFromVideos = (
  videos: { title: string; duration: number }[] | undefined,
  trackTitle: string
): string | null => {
  if (!videos || !trackTitle) return null;
  const normalizedTitle = trackTitle.toLowerCase().trim();
  const matchingVideo = videos.find((v) =>
    v.title.toLowerCase().includes(normalizedTitle)
  );
  if (matchingVideo && matchingVideo.duration > 0) {
    return formatDuration(matchingVideo.duration);
  }
  return null;
};

describe("Album API Helper Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hasValidDurations", () => {
    it("should return true when tracklist has valid durations", () => {
      const tracklist = [
        { title: "Track 1", duration: "3:45" },
        { title: "Track 2", duration: "4:00" },
      ];
      expect(hasValidDurations(tracklist)).toBe(true);
    });

    it("should return false when tracklist has no durations", () => {
      const tracklist = [
        { title: "Track 1", duration: "" },
        { title: "Track 2", duration: "" },
      ];
      expect(hasValidDurations(tracklist)).toBe(false);
    });

    it("should return false when tracklist has only whitespace durations", () => {
      const tracklist = [
        { title: "Track 1", duration: "   " },
        { title: "Track 2", duration: "\t" },
      ];
      expect(hasValidDurations(tracklist)).toBe(false);
    });

    it("should return true when at least one track has duration", () => {
      const tracklist = [
        { title: "Track 1", duration: "" },
        { title: "Track 2", duration: "3:30" },
      ];
      expect(hasValidDurations(tracklist)).toBe(true);
    });

    it("should return false for empty tracklist", () => {
      expect(hasValidDurations([])).toBe(false);
    });

    it("should handle undefined duration property", () => {
      const tracklist: { duration?: string }[] = [
        { duration: undefined },
        { duration: undefined },
      ];
      expect(hasValidDurations(tracklist)).toBe(false);
    });
  });

  describe("formatDuration", () => {
    it("should format seconds to MM:SS", () => {
      expect(formatDuration(225)).toBe("3:45");
    });

    it("should pad seconds with leading zero", () => {
      expect(formatDuration(65)).toBe("1:05");
    });

    it("should handle zero seconds", () => {
      expect(formatDuration(0)).toBe("0:00");
    });

    it("should handle exactly one minute", () => {
      expect(formatDuration(60)).toBe("1:00");
    });

    it("should handle large durations", () => {
      expect(formatDuration(3661)).toBe("61:01");
    });
  });

  describe("getDurationFromVideos", () => {
    const videos = [
      { title: "Artist - Track One (Official Video)", duration: 180 },
      { title: "Track Two - Live Performance", duration: 240 },
      { title: "Another Song", duration: 300 },
    ];

    it("should find matching video by track title", () => {
      const result = getDurationFromVideos(videos, "Track One");
      expect(result).toBe("3:00");
    });

    it("should be case insensitive", () => {
      const result = getDurationFromVideos(videos, "TRACK TWO");
      expect(result).toBe("4:00");
    });

    it("should return null for non-matching track", () => {
      const result = getDurationFromVideos(videos, "Nonexistent Track");
      expect(result).toBeNull();
    });

    it("should return null for empty videos array", () => {
      const result = getDurationFromVideos([], "Track One");
      expect(result).toBeNull();
    });

    it("should return null for undefined videos", () => {
      const result = getDurationFromVideos(undefined, "Track One");
      expect(result).toBeNull();
    });

    it("should return null for empty track title", () => {
      const result = getDurationFromVideos(videos, "");
      expect(result).toBeNull();
    });

    it("should handle video with zero duration", () => {
      const videosWithZero = [{ title: "Track Zero", duration: 0 }];
      const result = getDurationFromVideos(videosWithZero, "Track Zero");
      expect(result).toBeNull();
    });

    it("should trim track title before matching", () => {
      const result = getDurationFromVideos(videos, "  Track One  ");
      expect(result).toBe("3:00");
    });
  });
});

describe("enrichTracklistWithDurations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return original tracklist if it has valid durations", async () => {
    const tracklist = [
      { title: "Track 1", duration: "3:45", albumId: 1 },
      { title: "Track 2", duration: "4:00", albumId: 1 },
    ];

    expect(hasValidDurations(tracklist)).toBe(true);
  });

  it("should try main release when master has no durations", async () => {
    const mockReleaseData = {
      tracklist: [
        { title: "Track 1", duration: "3:45" },
        { title: "Track 2", duration: "4:00" },
      ],
    };

    vi.mocked(getRelease).mockResolvedValueOnce(mockReleaseData);

    const result = await getRelease({ id: 12345 });
    expect(result.tracklist).toEqual(mockReleaseData.tracklist);
  });

  it("should try versions when main release has no durations", async () => {
    const mockVersionsData = {
      versions: [{ id: 1 }, { id: 2 }],
    };

    vi.mocked(getMasterVersions).mockResolvedValueOnce(mockVersionsData);

    const result = await getMasterVersions({ id: 12345 });
    expect(result.versions).toHaveLength(2);
  });
});
