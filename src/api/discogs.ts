import { getDiscogsApiToken } from "../db/settings";

const BASE_URL = "https://api.discogs.com";

const makeRequest = async ({
  url,
  type,
}: {
  url: string;
  type: "GET";
}) => {
  const token = await getDiscogsApiToken();
  if (!token) {
    throw new Error(
      "Discogs API token not configured. Please set it in Settings.",
    );
  }

  const res = await fetch(url, {
    method: type,
    headers: {
      Authorization: `Discogs token=${token}`,
    },
  });

  return await res.json();
};

export const getMaster = async ({ id }: { id: number }) => {
  const releaseUrl = `${BASE_URL}/masters/${id}`;
  return await makeRequest({ url: releaseUrl, type: "GET" });
};

export const getRelease = async ({ id }: { id: number }) => {
  const releaseUrl = `${BASE_URL}/releases/${id}`;
  return await makeRequest({ url: releaseUrl, type: "GET" });
};

export const getMasterVersions = async ({ id }: { id: number }) => {
  const versionsUrl = `${BASE_URL}/masters/${id}/versions?per_page=10`;
  return await makeRequest({ url: versionsUrl, type: "GET" });
};

export const search = async ({ query }: { query: string }) => {
  const searchUrl = `${BASE_URL}/database/search?q=${query}&type=master&type=album%2Cartist%2Ctrack&market=US`;
  return await makeRequest({ url: searchUrl, type: "GET" });
};

// Find albums that are "similar" by leaning on Discogs' genre/style filters
// rather than a free-text query. The database search endpoint has no
// popularity sort, so we just take the relevance-ordered results.
export const searchSimilar = async ({
  genres = [],
  styles = [],
  year,
  perPage = 25,
}: {
  genres?: string[];
  styles?: string[];
  year?: string;
  perPage?: number;
}) => {
  const params = new URLSearchParams();
  params.set("type", "master");
  params.set("per_page", perPage.toString());

  // Style is the most specific signal; genre is the broader fallback.
  if (styles[0]) params.set("style", styles[0]);
  if (genres[0]) params.set("genre", genres[0]);
  if (year) params.set("year", year);

  const searchUrl = `${BASE_URL}/database/search?${params.toString()}`;
  return await makeRequest({ url: searchUrl, type: "GET" });
};

export const searchTrack = async ({
  track,
  artist,
}: {
  track: string;
  artist?: string;
}) => {
  const query = artist ? `${track} ${artist}` : track;
  const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
    query,
  )}&type=release&per_page=5`;
  return await makeRequest({ url: searchUrl, type: "GET" });
};

export const getArtist = async ({ id }: { id: number }) => {
  const artistUrl = `${BASE_URL}/artists/${id}`;
  return await makeRequest({ url: artistUrl, type: "GET" });
};
