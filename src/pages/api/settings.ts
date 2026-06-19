import type { APIRoute } from "astro";
import { getSettings, setDiscogsApiToken } from "../../db/settings";
import { apiTracer, loggy } from "../../util/loggy";

export const GET: APIRoute = async ({ request }) => {
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const span = apiTracer.startSpan("api.settings_get", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "GET", "http.route": "/api/settings" },
  });

  loggy.info("Settings GET request", {
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    const settings = await getSettings();

    loggy.info("Settings fetched successfully", {
      hasToken: !!settings?.discogsApiToken,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("ok");
    span.end();

    return new Response(
      JSON.stringify({
        discogsApiToken: settings?.discogsApiToken || "",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    loggy.error("Error fetching settings", {
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const span = apiTracer.startSpan("api.settings_update", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "POST", "http.route": "/api/settings" },
  });

  loggy.info("Settings POST request", {
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  try {
    const body = await request.json();
    const { discogsApiToken } = body;

    if (typeof discogsApiToken !== "string") {
      loggy.warn("Invalid discogs API token in request", {
        traceId: span.context.traceId,
        spanId: span.context.spanId,
      });

      span.setStatus("error", "Invalid discogs API token");
      span.end();

      return new Response(
        JSON.stringify({ error: "Invalid discogs API token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await setDiscogsApiToken(discogsApiToken);

    loggy.info("Settings updated successfully", {
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("ok");
    span.end();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    loggy.error("Error saving settings", {
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    return new Response(JSON.stringify({ error: "Failed to save settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
