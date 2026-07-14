import type { APIRoute } from "astro";
import { getMasterVersions, getRelease } from "../../../api/discogs";
import { addToWishlist } from "../../../db/wishlist";
import type { Album, DiscogsArtist } from "../../../types/album";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { discogsId, resultType, notes } = await request.json();

    if (!discogsId) {
      return new Response(JSON.stringify({ error: "Discogs ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If it's a master, get the first release version
    let releaseId = discogsId;
    if (resultType === "master") {
      const masterVersions = await getMasterVersions({ id: discogsId });
      if (masterVersions.versions && masterVersions.versions.length > 0) {
        releaseId = masterVersions.versions[0].id;
      }
    }

    // Fetch full release details from Discogs
    const releaseData = await getRelease({ id: releaseId });

    // Transform Discogs data to our Album format
    const album: Album = {
      title: releaseData.title,
      year: releaseData.year?.toString() || "",
      genres: releaseData.genres?.join(", ") || "",
      styles: releaseData.styles?.join(", ") || "",
      discogsId: releaseData.id,
      imageUrl: releaseData.images?.[0]?.uri || "",
      artistId: 0, // Will be set in addToWishlist function
      format: releaseData.formats?.[0]?.name,
      country: releaseData.country,
      label: releaseData.labels?.[0]?.name,
      releasedDate: releaseData.released,
      trackCount: releaseData.tracklist?.length,
    };

    // Transform artists
    const albumArtist: [DiscogsArtist] = [
      {
        id: releaseData.artists?.[0]?.id,
        name: releaseData.artists?.[0]?.name,
        thumbnail_url: releaseData.artists?.[0]?.thumb,
      },
    ];

    // Add to wishlist
    const wishlistId = await addToWishlist({
      album,
      albumArtist,
      notes,
    });

    return new Response(JSON.stringify({ success: true, wishlistId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return new Response(
      JSON.stringify({ error: "Failed to add to wishlist" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
