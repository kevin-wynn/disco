import { useState, useMemo, useEffect } from "react";
import type { Album, Artist, GridData } from "../types/album";
import { AlbumGridItem } from "./AlbumGridItem";
import { sanitizeArtistName } from "../util/string";

type SortField = "album" | "artist";
type SortOrder = "asc" | "desc";

const GRID_SIZE_KEY = "disco-grid-size";
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 8;
const DEFAULT_COLUMNS = 4;

const getInitialGridColumns = (key: string): number => {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  const saved = localStorage.getItem(key);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (parsed >= MIN_COLUMNS && parsed <= MAX_COLUMNS) {
      return parsed;
    }
  }
  return DEFAULT_COLUMNS;
};

export const AlbumsGrid = ({ data }: { data: GridData }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("album");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [gridColumns, setGridColumns] = useState(() => getInitialGridColumns(GRID_SIZE_KEY));

  const handleGridSizeChange = (value: number) => {
    setGridColumns(value);
    localStorage.setItem(GRID_SIZE_KEY, value.toString());
  };

  const getArtistName = (artists: Artist[] | Artist | null): string => {
    if (!artists) return "";
    if (Array.isArray(artists)) {
      return artists.map((a) => sanitizeArtistName(a.name)).join(", ");
    }
    return sanitizeArtistName(artists.name);
  };

  const filteredAndSortedData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = data.filter((item) => {
      if (!query) return true;
      const albumTitle = item.albums.title.toLowerCase();
      const artistName = getArtistName(item.artists).toLowerCase();
      return albumTitle.includes(query) || artistName.includes(query);
    });

    return filtered.sort((a, b) => {
      let valueA: string;
      let valueB: string;

      if (sortField === "album") {
        valueA = a.albums.title.toLowerCase();
        valueB = b.albums.title.toLowerCase();
      } else {
        valueA = getArtistName(a.artists).toLowerCase();
        valueB = getArtistName(b.artists).toLowerCase();
      }

      const comparison = valueA.localeCompare(valueB);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data, searchQuery, sortField, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search albums or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 px-6 pl-10 bg-white rounded-full outline-none border-2 border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 text-sm">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full text-gray-800 focus:outline-none focus:border-blue-500"
          >
            <option value="album">Album</option>
            <option value="artist">Artist</option>
          </select>
          <button
            onClick={toggleSortOrder}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full text-gray-800 hover:bg-gray-50 focus:outline-none focus:border-blue-500 flex items-center gap-1"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            {sortOrder === "asc" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            <span className="text-sm">{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
          </button>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" strokeWidth={2} />
            <rect x="14" y="3" width="7" height="7" strokeWidth={2} />
            <rect x="3" y="14" width="7" height="7" strokeWidth={2} />
            <rect x="14" y="14" width="7" height="7" strokeWidth={2} />
          </svg>
          <input
            type="range"
            min={MIN_COLUMNS}
            max={MAX_COLUMNS}
            value={gridColumns}
            onChange={(e) => handleGridSizeChange(parseInt(e.target.value, 10))}
            className="w-24 sm:w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            title={`${gridColumns} albums per row`}
          />
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="4" width="6" height="6" strokeWidth={2} />
            <rect x="14" y="4" width="6" height="6" strokeWidth={2} />
            <rect x="4" y="14" width="6" height="6" strokeWidth={2} />
            <rect x="14" y="14" width="6" height="6" strokeWidth={2} />
          </svg>
        </div>
      </div>

      {filteredAndSortedData.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No albums found matching "{searchQuery}"
        </div>
      ) : (
        <div
          className="grid gap-4 items-start mt-6"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
        >
          {filteredAndSortedData.map((item) => (
            <AlbumGridItem
              key={item.albums.id}
              album={item.albums}
              artists={item.artists}
              size={gridColumns <= 3 ? "large" : gridColumns <= 5 ? "medium" : "small"}
            />
          ))}
        </div>
      )}
    </div>
  );
};
