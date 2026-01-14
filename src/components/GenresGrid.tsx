import { useState, useMemo, useEffect } from "react";
import type { Album, Artist, GridData } from "../types/album";
import { AlbumGridItem } from "./AlbumGridItem";

type GenreAlbums = {
  genre: string;
  albums: GridData;
};

const GRID_SIZE_KEY = "disco-genres-grid-size";
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 8;
const DEFAULT_COLUMNS = 4;
const MOBILE_BREAKPOINT = 640;

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

export const GenresGrid = ({ data }: { data: GridData }) => {
  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set());
  const [gridColumns, setGridColumns] = useState(() => getInitialGridColumns(GRID_SIZE_KEY));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleGridSizeChange = (value: number) => {
    setGridColumns(value);
    localStorage.setItem(GRID_SIZE_KEY, value.toString());
  };

  const genreGroups = useMemo(() => {
    const genreMap = new Map<string, GridData>();

    data.forEach((item) => {
      const genresStr = item.albums.genres || "";
      const genres = genresStr
        .split(",")
        .map((g) => g.trim().replace(/^&\s*/, ""))
        .filter((g) => g.length > 0);

      if (genres.length === 0) {
        genres.push("Unknown");
      }

      genres.forEach((genre) => {
        if (!genreMap.has(genre)) {
          genreMap.set(genre, []);
        }
        genreMap.get(genre)!.push(item);
      });
    });

    const sorted: GenreAlbums[] = Array.from(genreMap.entries())
      .map(([genre, albums]) => ({ genre, albums }))
      .sort((a, b) => a.genre.localeCompare(b.genre));

    return sorted;
  }, [data]);

  const toggleGenre = (genre: string) => {
    setExpandedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) {
        next.delete(genre);
      } else {
        next.add(genre);
      }
      return next;
    });
  };

  const previewCount = gridColumns;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-bold uppercase text-lg">Genres</h1>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            {genreGroups.length} genres • {data.length} albums
          </span>
          <div className="flex items-center gap-3">
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
      </div>

      {genreGroups.map(({ genre, albums }) => {
        const isExpanded = expandedGenres.has(genre);
        const displayAlbums = isExpanded ? albums : albums.slice(0, previewCount);
        const hasMore = albums.length > previewCount;

        return (
          <div key={genre} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {genre}
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({albums.length} {albums.length === 1 ? "album" : "albums"})
                </span>
              </h2>
              {hasMore && (
                <button
                  onClick={() => toggleGenre(genre)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? "Show less" : `Show all ${albums.length}`}
                </button>
              )}
            </div>

            <div
              className="grid gap-2 sm:gap-4 items-start"
              style={{ gridTemplateColumns: `repeat(${isMobile ? 2 : gridColumns}, minmax(0, 1fr))` }}
            >
              {displayAlbums.map((item) => (
                <AlbumGridItem
                  key={`${genre}-${item.albums.id}`}
                  album={item.albums}
                  artists={item.artists}
                  size={gridColumns <= 3 ? "large" : gridColumns <= 5 ? "medium" : "small"}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
