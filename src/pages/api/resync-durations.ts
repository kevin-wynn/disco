import type { APIRoute } from "astro";
import { db } from "../../db";
import { albums, tracks, artists } from "../../db/schema";
import { eq, isNull, or } from "drizzle-orm";
import {
  getMaster,
  getRelease,
  getMasterVersions,
  searchTrack,
} from "../../api/discogs";

export const POST: APIRoute = async () => {
  try {
    // Get all tracks with null or empty duration
    const tracksWithNullDuration = await db
      .select({
        trackId: tracks.id,
        trackTitle: tracks.title,
        albumId: tracks.albumId,
      })
      .from(tracks)
      .where(or(isNull(tracks.duration), eq(tracks.duration, "")));

    if (tracksWithNullDuration.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No tracks with missing durations found",
          updated: 0,
        })
      );
    }

    // Get unique album IDs
    const uniqueAlbumIds = Array.from(
      new Set(tracksWithNullDuration.map((t) => t.albumId))
    );

    // Build a map of albumId -> { discogsId, artistName }
    const albumInfoMap: Record<
      number,
      { discogsId: number | null; artistName: string | null }
    > = {};
    for (const albumId of uniqueAlbumIds) {
      const albumData = await db
        .select({
          id: albums.id,
          discogsId: albums.discogsId,
          artistName: artists.name,
        })
        .from(albums)
        .leftJoin(artists, eq(albums.artistId, artists.id))
        .where(eq(albums.id, albumId));

      if (albumData.length > 0) {
        albumInfoMap[albumId] = {
          discogsId: albumData[0].discogsId,
          artistName: albumData[0].artistName,
        };
      }
    }

    let updatedCount = 0;

    // Helper to search for individual track duration via Discogs search
    const searchIndividualTrackDuration = async (
      trackTitle: string,
      artistName: string | null
    ): Promise<string | null> => {
      if (!trackTitle) return null;

      try {
        const searchResults = await searchTrack({
          track: trackTitle,
          artist: artistName || undefined,
        });

        if (!searchResults?.results?.length) return null;

        // Try each search result to find one with matching track duration
        for (const result of searchResults.results.slice(0, 3)) {
          if (!result.id) continue;

          const releaseData = await getRelease({ id: result.id });
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (!releaseData?.tracklist) continue;

          // Find matching track in the release
          const matchingTrack = releaseData.tracklist.find(
            (t: { title: string; duration?: string }) =>
              t.title.toLowerCase() === trackTitle.toLowerCase() &&
              t.duration &&
              t.duration.trim() !== ""
          );

          if (matchingTrack?.duration) {
            return matchingTrack.duration;
          }
        }
      } catch (error) {
        console.error(`Error searching for track "${trackTitle}":`, error);
      }

      return null;
    };

    // For each unique album, fetch from Discogs and update tracks
    for (const albumId of uniqueAlbumIds) {
      const albumInfo = albumInfoMap[albumId];
      const discogsId = albumInfo?.discogsId;
      const artistName = albumInfo?.artistName;

      // Get tracks for this album that need updating
      const albumTracks = tracksWithNullDuration.filter(
        (t) => t.albumId === albumId
      );

      // If no discogsId, try individual track search for each track
      if (!discogsId) {
        for (const track of albumTracks) {
          if (!track.trackTitle) continue;

          const duration = await searchIndividualTrackDuration(
            track.trackTitle,
            artistName
          );

          if (duration) {
            await db
              .update(tracks)
              .set({ duration })
              .where(eq(tracks.id, track.trackId!));
            updatedCount++;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        continue;
      }

      // Fetch master to get main_release ID, then fetch release for duration data
      const masterData = await getMaster({ id: discogsId });
      if (!masterData) continue;

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

      // Try to get the main release which often has better duration data
      let discogsData = masterData;

      // First try main release
      if (masterData.main_release) {
        const releaseData = await getRelease({ id: masterData.main_release });
        if (
          releaseData?.tracklist &&
          hasValidDurations(releaseData.tracklist)
        ) {
          discogsData = releaseData;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // If main release doesn't have durations, try other versions
      if (!hasValidDurations(discogsData.tracklist)) {
        const versionsData = await getMasterVersions({ id: discogsId });
        if (versionsData?.versions) {
          for (const version of versionsData.versions) {
            if (version.id === masterData.main_release) continue; // Skip already tried
            const releaseData = await getRelease({ id: version.id });
            if (
              releaseData?.tracklist &&
              hasValidDurations(releaseData.tracklist)
            ) {
              discogsData = releaseData;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!discogsData || !discogsData.tracklist) continue;

      // Match tracks by title and update duration
      for (const track of albumTracks) {
        const matchingDiscogsTrack = discogsData.tracklist.find(
          (dt: { title: string; duration: string }) =>
            dt.title.toLowerCase() === track.trackTitle?.toLowerCase()
        );

        let duration: string | null = null;

        // First try to get duration from tracklist
        if (matchingDiscogsTrack && matchingDiscogsTrack.duration) {
          duration = matchingDiscogsTrack.duration;
        }

        // Fallback: try to get duration from video data if tracklist duration is empty
        if (!duration && track.trackTitle) {
          duration = getDurationFromVideos(
            discogsData.videos,
            track.trackTitle
          );
        }

        // Final fallback: search for individual track on Discogs
        if (!duration && track.trackTitle) {
          duration = await searchIndividualTrackDuration(
            track.trackTitle,
            artistName
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (duration) {
          await db
            .update(tracks)
            .set({ duration })
            .where(eq(tracks.id, track.trackId!));
          updatedCount++;
        }
      }

      // Add a small delay to respect Discogs rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${updatedCount} track durations`,
        updated: updatedCount,
        total: tracksWithNullDuration.length,
      })
    );
  } catch (error) {
    console.error("Error resyncing durations:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to resync track durations",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
