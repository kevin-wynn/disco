import { getDiscogsApiToken } from "../db/settings";
import { loggy } from "../util/loggy";

const BASE_URL = "https://api.discogs.com";

const makeRequest = async ({ url, type }: { url: string; type: "GET" }) => {
  loggy.log(`Making Discogs API request`, { api: "discogs", url, method: type });
  const token = await getDiscogsApiToken();
  if (!token) {
    loggy.error("Discogs API token not configured", { api: "discogs", error: "missing_token" });
    throw new Error(
      "Discogs API token not configured. Please set it in Settings."
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

export const searchTrack = async ({
  track,
  artist,
}: {
  track: string;
  artist?: string;
}) => {
  const query = artist ? `${track} ${artist}` : track;
  const searchUrl = `${BASE_URL}/database/search?q=${encodeURIComponent(
    query
  )}&type=release&per_page=5`;
  return await makeRequest({ url: searchUrl, type: "GET" });
};
