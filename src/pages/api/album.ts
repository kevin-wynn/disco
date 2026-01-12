import type { APIRoute } from "astro";
import type { Album, Track } from "../../types/album";
import { saveAlbum } from "../../db/albums";
import { getRelease, getMasterVersions } from "../../api/discogs";

// Helper to check if tracklist has duration data
const hasValidDurations = (tracklist: { duration?: string }[]) =>
  tracklist?.some((t) => t.duration && t.duration.trim() !== "");

// Helper to convert seconds to MM:SS format
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Helper to extract duration from video data by matching track title
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

// Enrich tracklist with duration data from various sources
const enrichTracklistWithDurations = async (masterData: {
  id: number;
  main_release?: number;
  tracklist: Track[];
  videos?: { title: string; duration: number }[];
}): Promise<Track[]> => {
  let tracklist = masterData.tracklist;
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
    } catch (error) {
      console.error("Error fetching main release:", error);
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
        } catch (error) {
          console.error(`Error fetching version ${version.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching versions:", error);
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

  // Enrich tracklist with duration data if missing
  const enrichedTracklist = await enrichTracklistWithDurations({
    id: data.id,
    main_release: data.main_release,
    tracklist: data.tracklist,
    videos: data.videos,
  });

  const album: Album = {
    title: data.title,
    artistId: 0,
    year: data.year.toString(),
    discogsId: data.id,
    imageUrl:
      data.selectedImageUrl ||
      data.images?.find((image: { type: string }) => image.type === "primary")
        ?.uri ||
      data.images?.[0]?.uri ||
      "",
    genres: data.genres.join(", "),
    styles: data.styles.join(", "),
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
    })
  );
};

// export const DELETE: APIRoute = ({ request }) => {
//   return new Response(
//     JSON.stringify({
//       message: "This was a DELETE!",
//     })
//   );
// };

// export const ALL: APIRoute = ({ request }) => {
//   return new Response(
//     JSON.stringify({
//       message: `This was a ${request.method}!`,
//     })
//   );
// };
