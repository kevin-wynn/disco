import type { APIRoute } from "astro";
import { getDiscogsApiToken } from "../../../db/settings";
import { apiTracer, discogsTracer, loggy } from "../../../util/loggy";

const BASE_URL = "https://api.discogs.com";

export const GET: APIRoute = async ({ request }) => {
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const span = apiTracer.startSpan("api.discogs_master", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "GET", "http.route": "/api/discogs/master" },
  });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  loggy.info("Master request received", {
    masterId: id,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  if (!id) {
    loggy.warn("Master request missing ID parameter", {
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
    span.setStatus("error", "ID parameter required");
    span.end();
    return new Response(JSON.stringify({ error: "ID parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  span.setAttribute("master.id", parseInt(id));

  const token = await getDiscogsApiToken();
  if (!token) {
    loggy.error("Discogs API token not configured", {
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
    span.setStatus("error", "Discogs API token not configured");
    span.end();
    return new Response(
      JSON.stringify({
        error: "Discogs API token not configured. Please set it in Settings.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const masterUrl = `${BASE_URL}/masters/${id}`;

  // Use discogsTracer for external API call (shows as separate service)
  const fetchSpan = discogsTracer.startSpan("discogs.get_master", {
    kind: "client",
    parent: span.context,
    attributes: {
      "http.url": masterUrl,
      "http.method": "GET",
      "peer.service": "api.discogs.com",
      "master.id": parseInt(id),
    },
  });

  loggy.info("Calling Discogs API for master", {
    masterId: id,
    url: masterUrl,
    traceId: fetchSpan.context.traceId,
    spanId: fetchSpan.context.spanId,
  });

  try {
    const res = await fetch(masterUrl, {
      method: "GET",
      headers: {
        Authorization: `Discogs token=${token}`,
      },
    });

    const data = await res.json();

    fetchSpan.setAttribute("http.status_code", res.status);
    fetchSpan.setStatus(res.ok ? "ok" : "error");
    fetchSpan.end();

    loggy.info("Discogs master response", {
      masterId: id,
      statusCode: res.status,
      title: data.title,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setAttribute("http.status_code", res.status);
    span.setStatus(res.ok ? "ok" : "error");
    span.end();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    fetchSpan.setStatus("error", String(error));
    fetchSpan.end();

    loggy.error("Error fetching master", {
      masterId: id,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.setStatus("error", String(error));
    span.end();

    return new Response(JSON.stringify({ error: "Failed to fetch master" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
