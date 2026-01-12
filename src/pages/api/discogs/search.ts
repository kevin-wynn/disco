import type { APIRoute } from "astro";

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

  const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
    query
  )}&type=master&per_page=20&page=${page}`;

  const res = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization: `Discogs token=${
        import.meta.env.PUBLIC_DISCOGS_API_TOKEN
      }`,
    },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
