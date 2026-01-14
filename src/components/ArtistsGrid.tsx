import { useState, useMemo, useEffect } from "react";
import type { Artist } from "../types/album";
import { sanitizeArtistName } from "../util/string";

type LetterArtists = {
  letter: string;
  artists: Artist[];
};

const GRID_SIZE_KEY = "disco-artists-grid-size";
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

export const ArtistsGrid = ({ data }: { data: Artist[] }) => {
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());
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

  const letterGroups = useMemo(() => {
    const letterMap = new Map<string, Artist[]>();

    data.forEach((artist) => {
      const name = artist.name || "";
      const firstChar = name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : "#";

      if (!letterMap.has(letter)) {
        letterMap.set(letter, []);
      }
      letterMap.get(letter)!.push(artist);
    });

    const sorted: LetterArtists[] = Array.from(letterMap.entries())
      .map(([letter, artists]) => ({
        letter,
        artists: artists.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
      }))
      .sort((a, b) => {
        if (a.letter === "#") return 1;
        if (b.letter === "#") return -1;
        return a.letter.localeCompare(b.letter);
      });

    return sorted;
  }, [data]);

  const toggleLetter = (letter: string) => {
    setExpandedLetters((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) {
        next.delete(letter);
      } else {
        next.add(letter);
      }
      return next;
    });
  };

  const previewCount = gridColumns;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-bold uppercase text-lg">Artists</h1>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            {letterGroups.length} letters • {data.length} artists
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
              title={`${gridColumns} artists per row`}
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

      {letterGroups.map(({ letter, artists }) => {
        const isExpanded = expandedLetters.has(letter);
        const displayArtists = isExpanded ? artists : artists.slice(0, previewCount);
        const hasMore = artists.length > previewCount;

        return (
          <div key={letter} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {letter}
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({artists.length} {artists.length === 1 ? "artist" : "artists"})
                </span>
              </h2>
              {hasMore && (
                <button
                  onClick={() => toggleLetter(letter)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? "Show less" : `Show all ${artists.length}`}
                </button>
              )}
            </div>

            <div
              className="grid gap-2 sm:gap-4 items-start"
              style={{ gridTemplateColumns: `repeat(${isMobile ? 2 : gridColumns}, minmax(0, 1fr))` }}
            >
              {displayArtists.map((artist) => (
                <div key={artist.id} className="flex flex-col gap-2">
                  <div className="aspect-square overflow-hidden rounded-full bg-gray-800">
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
                          className="w-12 h-12"
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
                  <p
                    className={`text-center font-medium text-gray-900 dark:text-white ${
                      gridColumns <= 3 ? "text-base" : gridColumns <= 5 ? "text-sm" : "text-xs"
                    }`}
                  >
                    {sanitizeArtistName(artist.name || "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
