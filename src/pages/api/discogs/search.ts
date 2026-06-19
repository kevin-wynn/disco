import type { APIRoute } from "astro";
import { getDiscogsApiToken } from "../../../db/settings";
import { apiTracer, discogsTracer, loggy, metrics } from "../../../util/loggy";

const BASE_URL = "https://api.discogs.com";

export const GET: APIRoute = async ({ request }) => {
  // Extract parent context from incoming request headers (if any)
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const span = apiTracer.startSpan("api.discogs_search", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "GET", "http.route": "/api/discogs/search" },
  });
  const end = metrics.startRequest();

  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const page = url.searchParams.get("page") || "1";

  loggy.info("Search request received", {
    query,
    page,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  if (!query) {
    loggy.warn("Search request missing query parameter", {
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
    span.setStatus("error", "Query parameter required");
    span.end();
    return new Response(JSON.stringify({ error: "Query parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  span.setAttribute("search.query", query);
  span.setAttribute("search.page", parseInt(page));

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

  const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
    query,
  )}&type=master&per_page=20&page=${page}`;

  // Use discogsTracer for external API call (shows as separate service)
  const fetchSpan = discogsTracer.startSpan("discogs.search", {
    kind: "client",
    parent: span.context,
    attributes: {
      "http.url": searchUrl,
      "http.method": "GET",
      "peer.service": "api.discogs.com",
    },
  });

  loggy.info("Calling Discogs API", {
    url: searchUrl,
    traceId: fetchSpan.context.traceId,
    spanId: fetchSpan.context.spanId,
  });

  const res = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization: `Discogs token=${token}`,
    },
  });

  const data = await res.json();

  fetchSpan.setAttribute("http.status_code", res.status);
  fetchSpan.setStatus(res.ok ? "ok" : "error");
  fetchSpan.end();

  loggy.info("Discogs API response", {
    statusCode: res.status,
    resultsCount: data.results?.length || 0,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  span.setAttribute("http.status_code", res.status);
  span.setAttribute("search.results_count", data.results?.length || 0);

  end({
    path: "/api/discogs/search",
    method: "GET",
    statusCode: res.status,
    bytesIn: 0,
    bytesOut: JSON.stringify(data).length,
  });

  span.setStatus(res.ok ? "ok" : "error");
  span.end();

  loggy.info("Search request completed", {
    query,
    resultsCount: data.results?.length || 0,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
