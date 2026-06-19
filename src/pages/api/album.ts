import type { LoggySpan } from "@loggydev/loggy-node/dist/tracing/span";
import type { APIRoute } from "astro";
import { getMasterVersions, getRelease } from "../../api/discogs";
import { deleteAlbum, saveAlbum } from "../../db/albums";
import type { Album, Track } from "../../types/album";
import { apiTracer, loggy } from "../../util/loggy";

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
const getDetailedReleaseData = async (
  discogsData: any,
  parentSpan?: LoggySpan,
): Promise<any> => {
  const span = apiTracer.startSpan("album.get_detailed_release", {
    parent: parentSpan?.context,
    attributes: { "discogs.id": discogsData.id },
  });

  // If we have master data with main_release, fetch the detailed release
  if (discogsData.main_release) {
    try {
      loggy.info(
        `Fetching main release ${discogsData.main_release} for detailed info`,
        {
          masterId: discogsData.id,
          releaseId: discogsData.main_release,
          traceId: span.context.traceId,
          spanId: span.context.spanId,
        },
      );

      const releaseData = await getRelease({
        id: discogsData.main_release,
        parentContext: span.context,
      });

      // Merge master and release data, prioritizing release data for specific fields
      const mergedData = {
        ...discogsData,
        formats: releaseData.formats,
        country: releaseData.country,
        labels: releaseData.labels,
        released: releaseData.released,
        // Keep master tracklist as it might be more complete
      };

      span.setStatus("ok");
      span.end();
      loggy.info("Successfully merged master + release data for new album", {
        masterId: discogsData.id,
        releaseId: discogsData.main_release,
        traceId: span.context.traceId,
        spanId: span.context.spanId,
      });

      return mergedData;
    } catch (error) {
      loggy.warn(`Could not fetch main release for new album: ${error}`, {
        masterId: discogsData.id,
        releaseId: discogsData.main_release,
        error: String(error),
        traceId: span.context.traceId,
        spanId: span.context.spanId,
      });
      span.setStatus("error", String(error));
      span.end();
      return discogsData; // Return original data if fetch fails
    }
  }

  // If it's already a release or no main_release, return as-is
  span.setStatus("ok");
  span.end();
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
const enrichTracklistWithDurations = async (
  masterData: {
    id: number;
    main_release?: number;
    tracklist: Track[];
    videos?: { title: string; duration: number }[];
  },
  parentSpan?: LoggySpan,
): Promise<Track[]> => {
  const span = apiTracer.startSpan("album.enrich_tracklist", {
    parent: parentSpan?.context,
    attributes: { "album.id": masterData.id },
  });
  let tracklist = masterData.tracklist;
  let videos = masterData.videos;

  // If master tracklist already has valid durations, return as-is
  if (hasValidDurations(tracklist)) {
    loggy.info("Master tracklist already has valid durations", {
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
    span.setStatus("ok");
    span.end();
    return tracklist;
  }

  // Try main release for better duration data
  if (masterData.main_release) {
    try {
      const mainReleaseSpan = apiTracer.startSpan("album.main_release", {
        parent: span.context,
        attributes: { "release.id": masterData.main_release },
      });
      const releaseData = await getRelease({
        id: masterData.main_release,
        parentContext: mainReleaseSpan.context,
      });
      mainReleaseSpan.setStatus("ok");
      loggy.info("Fetched main release", {
        releaseId: masterData.main_release,
        traceId: span.context.traceId,
        spanId: span.context.spanId,
      });
      if (releaseData?.tracklist && hasValidDurations(releaseData.tracklist)) {
        mainReleaseSpan.end();
        loggy.info("Main release has valid durations", {
          releaseId: masterData.main_release,
          traceId: span.context.traceId,
          spanId: span.context.spanId,
        });
        span.setStatus("ok");
        span.end();
        return releaseData.tracklist;
      }
      // Keep videos from release if available
      if (releaseData?.videos) {
        videos = releaseData.videos;
      }
      mainReleaseSpan.end();
    } catch (error) {
      loggy.error("Error fetching main release", {
        error: String(error),
        releaseId: masterData.main_release,
        traceId: span.context.traceId,
        spanId: span.context.spanId,
      });
    }
  }

  // Try other versions if main release doesn't have durations
  loggy.info("Fetching versions", {
    masterId: masterData.id,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });
  try {
    const versionsData = await getMasterVersions({
      id: masterData.id,
      parentContext: span.context,
    });
    if (versionsData?.versions) {
      for (const version of versionsData.versions.slice(0, 5)) {
        if (version.id === masterData.main_release) continue;
        try {
          const releaseData = await getRelease({
            id: version.id,
            parentContext: span.context,
          });
          if (
            releaseData?.tracklist &&
            hasValidDurations(releaseData.tracklist)
          ) {
            loggy.info("Version has valid durations", {
              versionId: version.id,
              traceId: span.context.traceId,
              spanId: span.context.spanId,
            });
            span.setStatus("ok");
            span.end();
            return releaseData.tracklist;
          }
          // Keep videos from release if available and we don't have any
          if (!videos && releaseData?.videos) {
            videos = releaseData.videos;
          }
        } catch (error) {
          loggy.warn(`Error fetching version ${version.id}`, {
            error: String(error),
            versionId: version.id,
            traceId: span.context.traceId,
            spanId: span.context.spanId,
          });
        }
      }
    }
    loggy.info("No valid durations found in versions", {
      masterId: masterData.id,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
  } catch (error) {
    loggy.error("Error fetching versions", {
      error: String(error),
      masterId: masterData.id,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
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

  span.setStatus("ok");
  loggy.info("No valid durations found", {
    masterId: masterData.id,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });
  span.end();
  return tracklist;
};

export const POST: APIRoute = async ({ request }) => {
  // Extract parent context from incoming request headers (if any)
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const rootSpan = apiTracer.startSpan("album.create", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "POST", "http.route": "/api/album" },
  });

  const data = await request.json();
  loggy.info("Processing request", {
    traceId: rootSpan.context.traceId,
    spanId: rootSpan.context.spanId,
    albumId: data.id,
  });
  rootSpan.setAttribute("album.title", data.title);
  rootSpan.setAttribute("album.discogs_id", data.id);

  // Get detailed release data for new albums
  const detailedData = await getDetailedReleaseData(data, rootSpan);

  // Enrich tracklist with duration data if missing
  const enrichedTracklist = await enrichTracklistWithDurations(
    {
      id: detailedData.id,
      main_release: detailedData.main_release,
      tracklist: detailedData.tracklist,
      videos: detailedData.videos,
    },
    rootSpan,
  );

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
    parentSpan: rootSpan,
  });

  rootSpan.setStatus("ok");
  rootSpan.setAttribute("album.id", albumId);
  rootSpan.end();
  loggy.info("Album created", {
    traceId: rootSpan.context.traceId,
    spanId: rootSpan.context.spanId,
    albumId,
  });
  return new Response(
    JSON.stringify({
      album,
      albumId,
    }),
  );
};

export const DELETE: APIRoute = async ({ request }) => {
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const rootSpan = apiTracer.startSpan("album.delete", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "DELETE", "http.route": "/api/album" },
  });

  try {
    const url = new URL(request.url);
    const albumId = url.searchParams.get("id");

    if (!albumId) {
      loggy.error("Missing album ID in delete request", {
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Missing album ID");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Album ID is required" }), {
        status: 400,
      });
    }

    const albumIdNum = parseInt(albumId);
    if (isNaN(albumIdNum)) {
      loggy.error("Invalid album ID in delete request", {
        albumId,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Invalid album ID");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Invalid album ID" }), {
        status: 400,
      });
    }

    loggy.info("Processing album delete request", {
      albumId: albumIdNum,
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });

    const deleted = await deleteAlbum({
      albumId: albumIdNum,
      parentSpan: rootSpan,
    });

    if (!deleted) {
      loggy.warn("Album not found for deletion", {
        albumId: albumIdNum,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Album not found");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Album not found" }), {
        status: 404,
      });
    }

    rootSpan.setStatus("ok");
    rootSpan.end();

    loggy.info("Album deleted successfully", {
      albumId: albumIdNum,
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });

    return new Response(
      JSON.stringify({
        message: "Album deleted successfully",
        albumId: albumIdNum,
      }),
      { status: 200 },
    );
  } catch (error) {
    loggy.error("Error deleting album", {
      error: String(error),
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });
    rootSpan.setStatus("error", String(error));
    rootSpan.end();
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

// export const ALL: APIRoute = ({ request }) => {
//   return new Response(
//     JSON.stringify({
//       message: `This was a ${request.method}!`,
//     })
//   );
// };
