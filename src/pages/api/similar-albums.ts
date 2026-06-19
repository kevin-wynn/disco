import type { APIRoute } from "astro";
import { search } from "../../api/discogs";
import { getAlbumsByArtist } from "../../db/albums";
import type { Album } from "../../db/schema";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const albumId = url.searchParams.get("albumId");
    const artistId = url.searchParams.get("artistId");
    const artistName = url.searchParams.get("artistName");
    const genres = url.searchParams.get("genres");
    const year = url.searchParams.get("year");

    if (!albumId && !artistId && !artistName) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let similarAlbums: any[] = [];

    // Strategy 1: Get other albums by the same artist
    if (artistId) {
      const artistAlbums = await getAlbumsByArtist(parseInt(artistId));
      similarAlbums = artistAlbums
        .filter((album: Album) => album.id !== parseInt(albumId!))
        .slice(0, 3)
        .map((album: Album) => ({
          id: album.id,
          title: album.title,
          artist: album.artistId,
          year: album.year,
          imageUrl: album.imageUrl,
          source: "collection",
        }));
    }

    // Strategy 2: Search Discogs for similar albums by genre/year/artist
    if (artistName || genres) {
      let searchQuery = "";

      if (artistName) {
        searchQuery += artistName;
      }

      if (genres) {
        const genreList = genres.split(",").slice(0, 2).join(" "); // Take first 2 genres
        searchQuery += searchQuery ? ` ${genreList}` : genreList;
      }

      if (year) {
        // Search for albums within 2 years of the given year
        const yearNum = parseInt(year);
        const yearRange = `${Math.max(yearNum - 2, 1950)}..${Math.min(yearNum + 2, new Date().getFullYear())}`;
        searchQuery += searchQuery ? ` year:${yearRange}` : `year:${yearRange}`;
      }

      if (searchQuery) {
        try {
          const discogsResults = await search({ query: searchQuery });
          const discogsAlbums = discogsResults.results
            .filter(
              (result: any) =>
                result.type === "master" || result.type === "release",
            )
            .slice(0, 5)
            .map((result: any) => ({
              id: result.id,
              title: result.title,
              artist: result.artist,
              year: result.year,
              imageUrl: result.cover_image,
              source: "discogs",
              type: result.type,
            }));

          similarAlbums = [...similarAlbums, ...discogsAlbums];
        } catch (error) {
          console.error("Discogs search error:", error);
        }
      }
    }

    // Remove duplicates and limit results
    const uniqueAlbums = similarAlbums
      .filter(
        (album, index, self) =>
          index ===
          self.findIndex(
            (a) => a.title === album.title && a.artist === album.artist,
          ),
      )
      .slice(0, 6);

    return new Response(JSON.stringify({ albums: uniqueAlbums }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching similar albums:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch similar albums" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
