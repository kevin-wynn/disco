import type { APIRoute } from "astro";
import { searchSimilar } from "../../api/discogs";
import { getAlbumsByArtist } from "../../db/albums";
import type { Album } from "../../db/schema";

// Split a stored comma-separated string ("Rock, Alternative") into a clean list.
const parseList = (value: string | null): string[] =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

// Discogs master search results carry a combined "Artist - Title" string.
const splitTitle = (raw: string): { artist: string; title: string } => {
  const separatorIndex = raw.indexOf(" - ");
  if (separatorIndex === -1) {
    return { artist: "", title: raw };
  }
  return {
    artist: raw.slice(0, separatorIndex).trim(),
    title: raw.slice(separatorIndex + 3).trim(),
  };
};

const normalize = (value: string) => value.toLowerCase().trim();

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const albumId = url.searchParams.get("albumId");
    const artistId = url.searchParams.get("artistId");
    const artistName = url.searchParams.get("artistName");
    const genres = parseList(url.searchParams.get("genres"));
    const styles = parseList(url.searchParams.get("styles"));
    const year = url.searchParams.get("year");

    if (!albumId && !artistId && !artistName && genres.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const similarAlbums: any[] = [];

    // Strategy 1: A couple of other albums by the same artist already owned.
    if (artistId) {
      const artistAlbums = await getAlbumsByArtist(parseInt(artistId));
      const ownedByArtist = artistAlbums
        .filter((album: Album) => album.id !== parseInt(albumId ?? "0"))
        .slice(0, 2)
        .map((album: Album) => ({
          id: album.id,
          title: album.title,
          artist: artistName || "",
          year: album.year,
          imageUrl: album.imageUrl,
          source: "collection",
        }));
      similarAlbums.push(...ownedByArtist);
    }

    // Strategy 2: Discover genuinely similar records from Discogs using the
    // album's genre/style. This is the primary source of recommendations.
    if (genres.length > 0 || styles.length > 0) {
      try {
        const discogsResults = await searchSimilar({
          genres,
          styles,
          year: year ?? undefined,
        });

        const artistNeedle = artistName ? normalize(artistName) : null;

        const discogsAlbums = (discogsResults.results ?? [])
          .filter(
            (result: any) =>
              (result.type === "master" || result.type === "release") &&
              result.title,
          )
          .map((result: any) => {
            const { artist, title } = splitTitle(result.title);
            return {
              id: result.id,
              title,
              artist,
              year: result.year,
              imageUrl: result.cover_image || result.thumb,
              source: "discogs",
              type: result.type,
            };
          })
          // Skip the same artist so results feel like discovery, not a
          // discography listing.
          .filter(
            (album: any) =>
              !artistNeedle || normalize(album.artist) !== artistNeedle,
          );

        similarAlbums.push(...discogsAlbums);
      } catch (error) {
        console.error("Discogs similar search error:", error);
      }
    }

    // De-duplicate by artist/title and cap the list.
    const seen = new Set<string>();
    const uniqueAlbums = similarAlbums
      .filter((album) => {
        const key = `${normalize(String(album.artist))}::${normalize(
          String(album.title),
        )}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

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
