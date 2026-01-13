import type { APIRoute } from "astro";
import { getDiscogsApiToken } from "../../../db/settings";

const BASE_URL = "https://api.discogs.com";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "ID parameter required" }), {
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

  const masterUrl = `${BASE_URL}/masters/${id}`;

  try {
    const res = await fetch(masterUrl, {
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
  } catch (error) {
    console.error("Error fetching master:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch master" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
