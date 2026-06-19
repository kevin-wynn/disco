import type { SpanContext } from "@loggydev/loggy-node/dist/tracing/types";
import { getDiscogsApiToken } from "../db/settings";
import { discogsTracer, loggy } from "../util/loggy";

const BASE_URL = "https://api.discogs.com";

const makeRequest = async ({
  url,
  type,
  operationName,
  parentContext,
}: {
  url: string;
  type: "GET";
  operationName: string;
  parentContext?: SpanContext | null;
}) => {
  const span = discogsTracer.startSpan(operationName, {
    kind: "client",
    parent: parentContext,
    attributes: {
      "http.url": url,
      "http.method": type,
      "peer.service": "api.discogs.com",
    },
  });

  loggy.log(`Making Discogs API request`, {
    api: "discogs",
    url,
    method: type,
    traceId: span.context.traceId,
    spanId: span.context.spanId,
  });

  const token = await getDiscogsApiToken();
  if (!token) {
    loggy.error("Discogs API token not configured", {
      api: "discogs",
      error: "missing_token",
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
    span.setStatus("error", "Discogs API token not configured");
    span.end();
    throw new Error(
      "Discogs API token not configured. Please set it in Settings.",
    );
  }

  try {
    const res = await fetch(url, {
      method: type,
      headers: {
        Authorization: `Discogs token=${token}`,
      },
    });

    const data = await res.json();

    span.setAttribute("http.status_code", res.status);
    span.setStatus(res.ok ? "ok" : "error");

    loggy.info(`Discogs API response`, {
      api: "discogs",
      url,
      statusCode: res.status,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });

    span.end();
    return data;
  } catch (error) {
    span.setStatus("error", String(error));
    loggy.error(`Discogs API error`, {
      api: "discogs",
      url,
      error: String(error),
      traceId: span.context.traceId,
      spanId: span.context.spanId,
    });
    span.end();
    throw error;
  }
};

export const getMaster = async ({
  id,
  parentContext,
}: {
  id: number;
  parentContext?: SpanContext | null;
}) => {
  const releaseUrl = `${BASE_URL}/masters/${id}`;
  return await makeRequest({
    url: releaseUrl,
    type: "GET",
    operationName: "discogs.get_master",
    parentContext,
  });
};

export const getRelease = async ({
  id,
  parentContext,
}: {
  id: number;
  parentContext?: SpanContext | null;
}) => {
  const releaseUrl = `${BASE_URL}/releases/${id}`;
  return await makeRequest({
    url: releaseUrl,
    type: "GET",
    operationName: "discogs.get_release",
    parentContext,
  });
};

export const getMasterVersions = async ({
  id,
  parentContext,
}: {
  id: number;
  parentContext?: SpanContext | null;
}) => {
  const versionsUrl = `${BASE_URL}/masters/${id}/versions?per_page=10`;
  return await makeRequest({
    url: versionsUrl,
    type: "GET",
    operationName: "discogs.get_master_versions",
    parentContext,
  });
};

export const search = async ({
  query,
  parentContext,
}: {
  query: string;
  parentContext?: SpanContext | null;
}) => {
  const searchUrl = `${BASE_URL}/database/search?q=${query}&type=master&type=album%2Cartist%2Ctrack&market=US`;
  return await makeRequest({
    url: searchUrl,
    type: "GET",
    operationName: "discogs.search",
    parentContext,
  });
};

export const searchTrack = async ({
  track,
  artist,
  parentContext,
}: {
  track: string;
  artist?: string;
  parentContext?: SpanContext | null;
}) => {
  const query = artist ? `${track} ${artist}` : track;
  const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
    query,
  )}&type=release&per_page=5`;
  return await makeRequest({
    url: searchUrl,
    type: "GET",
    operationName: "discogs.search_track",
    parentContext,
  });
};

export const getArtist = async ({
  id,
  parentContext,
}: {
  id: number;
  parentContext?: SpanContext | null;
}) => {
  const artistUrl = `${BASE_URL}/artists/${id}`;
  return await makeRequest({
    url: artistUrl,
    type: "GET",
    operationName: "discogs.get_artist",
    parentContext,
  });
};

export const getArtistReleases = async ({
  id,
  sort = "year",
  sortOrder = "desc",
  parentContext,
}: {
  id: number;
  sort?: "year" | "title" | "format";
  sortOrder?: "asc" | "desc";
  parentContext?: SpanContext | null;
}) => {
  const releasesUrl = `${BASE_URL}/artists/${id}/releases?sort=${sort}&sort_order=${sortOrder}&per_page=50`;
  return await makeRequest({
    url: releasesUrl,
    type: "GET",
    operationName: "discogs.get_artist_releases",
    parentContext,
  });
};
