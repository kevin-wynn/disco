import type { APIRoute } from "astro";
import { getSettings, setDiscogsApiToken } from "../../db/settings";

export const GET: APIRoute = async () => {
  try {
    const settings = await getSettings();

    return new Response(
      JSON.stringify({
        discogsApiToken: settings?.discogsApiToken || "",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { discogsApiToken } = body;

    if (typeof discogsApiToken !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid discogs API token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await setDiscogsApiToken(discogsApiToken);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return new Response(JSON.stringify({ error: "Failed to save settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
