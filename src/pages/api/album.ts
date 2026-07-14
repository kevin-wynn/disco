import type { APIRoute } from "astro";
import { getMasterVersions, getRelease } from "../../api/discogs";
import { deleteAlbum, saveAlbum } from "../../db/albums";
import type { Album, Track } from "../../types/album";

// Helper to check if tracklist has duration data
const hasValidDurations = (tracklist: { duration?: string }[]) =>
  tracklist?.some((t) => t.duration && t.duration.trim() !== "");

// Helper to convert seconds to MM:SS format
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Helper to get detailed release data for new albums
const getDetailedReleaseData = async (discogsData: any): Promise<any> => {
  // If we have master data with main_release, fetch the detailed release
  if (discogsData.main_release) {
    try {
      const releaseData = await getRelease({ id: discogsData.main_release });

      // Merge master and release data, prioritizing release data for specific fields
      return {
        ...discogsData,
        formats: releaseData.formats,
        country: releaseData.country,
        labels: releaseData.labels,
        released: releaseData.released,
        // Keep master tracklist as it might be more complete
      };
    } catch {
      return discogsData; // Return original data if fetch fails
    }
  }

  // If it's already a release or no main_release, return as-is
  return discogsData;
};

const calculateTotalDuration = (tracklist: { duration?: string }[]): string => {
  let totalSeconds = 0;

  for (const track of tracklist) {
    if (!track.duration) continue;

    const parts = track.duration.split(":").map((p) => parseInt(p));
    if (parts.length === 2) {
      // MM:SS format
      totalSeconds += parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // H:MM:SS format
      totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getDurationFromVideos = (
  videos: { title: string; duration: number }[] | undefined,
  trackTitle: string,
): string | null => {
  if (!videos || !trackTitle) return null;
  const normalizedTitle = trackTitle.toLowerCase().trim();
  const matchingVideo = videos.find((v) =>
    v.title.toLowerCase().includes(normalizedTitle),
  );
  if (matchingVideo && matchingVideo.duration > 0) {
    return formatDuration(matchingVideo.duration);
  }
  return null;
};

// Enrich tracklist with duration data from various sources
const enrichTracklistWithDurations = async (masterData: {
  id: number;
  main_release?: number;
  tracklist: Track[];
  videos?: { title: string; duration: number }[];
}): Promise<Track[]> => {
  const tracklist = masterData.tracklist;
  let videos = masterData.videos;

  // If master tracklist already has valid durations, return as-is
  if (hasValidDurations(tracklist)) {
    return tracklist;
  }

  // Try main release for better duration data
  if (masterData.main_release) {
    try {
      const releaseData = await getRelease({ id: masterData.main_release });
      if (releaseData?.tracklist && hasValidDurations(releaseData.tracklist)) {
        return releaseData.tracklist;
      }
      // Keep videos from release if available
      if (releaseData?.videos) {
        videos = releaseData.videos;
      }
    } catch {
      // Ignore and fall through to other strategies
    }
  }

  // Try other versions if main release doesn't have durations
  try {
    const versionsData = await getMasterVersions({ id: masterData.id });
    if (versionsData?.versions) {
      for (const version of versionsData.versions.slice(0, 5)) {
        if (version.id === masterData.main_release) continue;
        try {
          const releaseData = await getRelease({ id: version.id });
          if (
            releaseData?.tracklist &&
            hasValidDurations(releaseData.tracklist)
          ) {
            return releaseData.tracklist;
          }
          // Keep videos from release if available and we don't have any
          if (!videos && releaseData?.videos) {
            videos = releaseData.videos;
          }
        } catch {
          // Skip versions that fail to fetch
        }
      }
    }
  } catch {
    // Ignore and fall through to video fallback
  }

  // Fallback: try to get durations from video data
  if (videos && videos.length > 0) {
    return tracklist.map((track) => {
      if (track.duration && track.duration.trim() !== "") {
        return track;
      }
      const videoDuration = getDurationFromVideos(videos, track.title);
      return videoDuration ? { ...track, duration: videoDuration } : track;
    });
  }

  return tracklist;
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  // Get detailed release data for new albums
  const detailedData = await getDetailedReleaseData(data);

  // Enrich tracklist with duration data if missing
  const enrichedTracklist = await enrichTracklistWithDurations({
    id: detailedData.id,
    main_release: detailedData.main_release,
    tracklist: detailedData.tracklist,
    videos: detailedData.videos,
  });

  const album: Album = {
    title: detailedData.title,
    artistId: 0,
    year: detailedData.year?.toString() || "",
    discogsId: detailedData.id,
    imageUrl:
      detailedData.selectedImageUrl ||
      detailedData.images?.find(
        (image: { type: string }) => image.type === "primary",
      )?.uri ||
      detailedData.images?.[0]?.uri ||
      "",
    genres: detailedData.genres?.join(", ") || "",
    styles: detailedData.styles?.join(", ") || "",
    format: detailedData.formats?.[0]?.name || "",
    country: detailedData.country || "",
    label: detailedData.labels?.[0]?.name || "",
    releasedDate: detailedData.released || "",
    totalDuration: calculateTotalDuration(enrichedTracklist),
    trackCount: enrichedTracklist.length,
  };

  const albumId = await saveAlbum({
    album,
    albumTracks: enrichedTracklist as [Track],
    albumArtist: data.artists,
  });

  return new Response(
    JSON.stringify({
      album,
      albumId,
    }),
  );
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const albumId = url.searchParams.get("id");

    if (!albumId) {
      return new Response(JSON.stringify({ error: "Album ID is required" }), {
        status: 400,
      });
    }

    const albumIdNum = parseInt(albumId);
    if (isNaN(albumIdNum)) {
      return new Response(JSON.stringify({ error: "Invalid album ID" }), {
        status: 400,
      });
    }

    const deleted = await deleteAlbum({ albumId: albumIdNum });

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Album not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Album deleted successfully",
        albumId: albumIdNum,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting album:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
