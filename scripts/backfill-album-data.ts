#!/usr/bin/env node

import { eq } from "drizzle-orm";
import { getMaster, getRelease } from "../src/api/discogs.ts";
import { db } from "../src/db/index.ts";
import { albums } from "../src/db/schema.ts";

// Helper to calculate total duration from tracklist
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

const backfillAlbumData = async () => {
  console.log("Starting album data backfill...");

  try {
    // Get all albums that have a discogsId
    const existingAlbums = await db
      .select()
      .from(albums)
      .where(eq(albums.discogsId, albums.discogsId));

    // Filter out albums without a discogsId
    const albumsToUpdate = existingAlbums.filter(
      (album) => album.discogsId != null,
    );

    console.log(`Found ${albumsToUpdate.length} albums to update`);

    for (const album of albumsToUpdate) {
      console.log(
        `Processing album: ${album.title} (ID: ${album.id}, Discogs ID: ${album.discogsId})`,
      );

      try {
        // Try to get master release first
        let discogsData;
        let isMaster = false;
        try {
          discogsData = await getMaster({ id: album.discogsId! });
          isMaster = true;
          console.log("✅ Fetched from MASTER endpoint");
        } catch (error) {
          // If master fails, try release
          try {
            discogsData = await getRelease({ id: album.discogsId! });
            console.log("✅ Fetched from RELEASE endpoint");
          } catch (releaseError) {
            console.log(
              `  ⚠️  Could not fetch data for Discogs ID ${album.discogsId}: ${(releaseError as Error).message}`,
            );
            continue;
          }
        }

        // If we got master data, fetch the main release for detailed info
        if (isMaster && discogsData.main_release) {
          try {
            console.log(
              `🔄 Fetching main release ${discogsData.main_release} for detailed info...`,
            );
            const releaseData = await getRelease({
              id: discogsData.main_release,
            });

            // Merge master and release data, prioritizing release data for specific fields
            discogsData = {
              ...discogsData,
              formats: releaseData.formats,
              country: releaseData.country,
              labels: releaseData.labels,
              released: releaseData.released,
              // Keep master tracklist as it might be more complete
            };
            console.log("✅ Successfully merged master + release data");
          } catch (releaseError) {
            console.log(
              `  ⚠️  Could not fetch main release: ${(releaseError as Error).message}`,
            );
            // Continue with master data only
          }
        }

        // Calculate total duration from tracklist
        const totalDuration = calculateTotalDuration(
          discogsData.tracklist || [],
        );

        // Prepare update data
        const updateData = {
          format: discogsData.formats?.[0]?.name || null,
          country: discogsData.country || null,
          label: discogsData.labels?.[0]?.name || null,
          releasedDate: discogsData.released || null,
          totalDuration: totalDuration,
          trackCount: discogsData.tracklist?.length || 0,
        };

        // Update the album
        await db.update(albums).set(updateData).where(eq(albums.id, album.id));

        console.log(`  ✅ Updated album: ${album.title}`);
        console.log(`     Format: ${updateData.format || "N/A"}`);
        console.log(`     Country: ${updateData.country || "N/A"}`);
        console.log(`     Label: ${updateData.label || "N/A"}`);
        console.log(`     Released: ${updateData.releasedDate || "N/A"}`);
        console.log(`     Duration: ${updateData.totalDuration}`);
        console.log(`     Tracks: ${updateData.trackCount}`);
      } catch (error) {
        console.error(
          `  ❌ Error updating album ${album.title}: ${(error as Error).message}`,
        );
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n✅ Backfill completed successfully!");
  } catch (error) {
    console.error("❌ Backfill failed:", (error as Error).message);
    process.exit(1);
  }
};

// Run the backfill
backfillAlbumData();
