import { useState } from "react";
import type { Album, Artist } from "../types/album";
import { AlbumGridItem } from "./AlbumGridItem";
import { SimilarAlbumsSidebar } from "./SimilarAlbumsSidebar";

interface ArtistDetailsProps {
  artist: Artist;
  albums: Album[];
}

const ArtistDetails = ({ artist, albums }: ArtistDetailsProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "releases" | "details"
  >("overview");

  // Parse JSON strings from database
  const urls = artist.urls
    ? typeof artist.urls === "string"
      ? JSON.parse(artist.urls)
      : artist.urls
    : [];
  const nameVariations = artist.nameVariations
    ? typeof artist.nameVariations === "string"
      ? JSON.parse(artist.nameVariations)
      : artist.nameVariations
    : [];
  const members = artist.members
    ? typeof artist.members === "string"
      ? JSON.parse(artist.members)
      : artist.members
    : [];

  const sortedAlbums = albums.sort((a, b) => {
    const yearA = parseInt(a.year || "0");
    const yearB = parseInt(b.year || "0");
    return yearB - yearA; // Most recent first
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name || "Artist"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-16 h-16 sm:w-20 sm:h-20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {artist.name}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                {albums.length > 0 && (
                  <span>
                    {albums.length} {albums.length === 1 ? "album" : "albums"}
                  </span>
                )}
                {artist.discogsId && (
                  <a
                    href={`https://www.discogs.com/artist/${artist.discogsId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View on Discogs
                  </a>
                )}
              </div>

              {artist.dataQuality && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Data quality: {artist.dataQuality}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex gap-8">
              {[
                { key: "overview" as const, label: "Overview" },
                { key: "releases" as const, label: "Releases" },
                { key: "details" as const, label: "Details" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-400 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              {artist.profile && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    About
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {artist.profile}
                  </p>
                </div>
              )}

              {urls.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Links
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {urls.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "releases" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Releases ({sortedAlbums.length})
                </h2>
              </div>

              {sortedAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sortedAlbums.map((album) => (
                    <AlbumGridItem
                      key={album.id}
                      album={album}
                      artists={artist}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No releases found for this artist.
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="flex flex-col gap-8">
              {/* Name Variations */}
              {nameVariations.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Name Variations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {nameVariations.map((variation: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                      >
                        {variation}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {members.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Members
                  </h3>
                  <div className="grid gap-3">
                    {members.map((member: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4 text-gray-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-300">{member.name}</span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            member.active
                              ? "bg-green-900 text-green-300"
                              : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {member.active ? "Active" : "Former"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Discogs Info */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Discogs Information
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>Discogs ID: {artist.discogsId}</div>
                  {artist.dataQuality && (
                    <div>Data Quality: {artist.dataQuality}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Only on large screens */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <SimilarAlbumsSidebar
          artistName={artist.name}
          genres={albums[0]?.genres}
          year={albums[0]?.year}
          title={`Similar to ${artist.name}`}
        />
      </div>
    </div>
  );
};

export default ArtistDetails;
