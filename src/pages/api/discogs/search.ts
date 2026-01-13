import type { APIRoute } from "astro";
import { getDiscogsApiToken } from "../../../db/settings";

const BASE_URL = "https://api.discogs.com";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const page = url.searchParams.get("page") || "1";

  if (!query) {
    return new Response(JSON.stringify({ error: "Query parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await getDiscogsApiToken();
  if (!token) {
    return new Response(
      JSON.stringify({
        error: "Discogs API token not configured. Please set it in Settings.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
    query
  )}&type=master&per_page=20&page=${page}`;

  const res = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization: `Discogs token=${token}`,
    },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
