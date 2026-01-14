import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { searchState, searchQuery } from "../store/Search";
import type { ReleaseResult, Result } from "../types/search";
import { User } from "./Icons/User";
import { MusicNote } from "./Icons/MusicNote";
import { AdjustmentsHorizontal } from "./Icons/AdjustmentsHorizontal";
import { InformationCircle } from "./Icons/InformationCircle";
import { CalendarDays } from "./Icons/CalendarDays";
import { Button } from "./Button";
import { ImageCarousel } from "./ImageCarousel";

type Image = {
  type: string;
  uri: string;
};


const ResultIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "artist":
      return <User />;

    case "master":
    case "release":
    default:
      return <MusicNote />;
  }
};

const ResultItem = ({ result }: { result: Result }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState(result.cover_image);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [masterData, setMasterData] = useState<ReleaseResult | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (result.type === "master" || result.type === "release") {
        try {
          const res = await fetch(`/api/discogs/master?id=${result.id}`);
          const data = await res.json();
          setMasterData(data);
          if (data.images && data.images.length > 0) {
            setImages(data.images);
            const primaryImage = data.images.find(
              (img: Image) => img.type === "primary"
            );
            setSelectedImage(primaryImage?.uri || data.images[0].uri);
          }
        } catch (error) {
          console.error("Error fetching images:", error);
        }
      }
      setImagesLoaded(true);
    };

    fetchImages();
  }, [result.id, result.type]);

  const handleButtonClick = async (id: number) => {
    setIsLoading(true);
    try {
      let results: ReleaseResult;
      if (masterData) {
        results = masterData;
      } else {
        const masterRes = await fetch(`/api/discogs/master?id=${id}`);
        results = await masterRes.json();
      }
      console.log("results:", results);
      const res = await fetch("/api/album", {
        method: "POST",
        body: JSON.stringify({
          ...results,
          selectedImageUrl: selectedImage,
        }),
      });

      const json = await res.json();
      console.log("json:", json);

      if (json.albumId) {
        window.location.href = `/album/${json.albumId}`;
      }
    } catch (error) {
      console.error("Error adding album:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row mb-8 gap-4">
      {imagesLoaded && images.length > 0 ? (
        <ImageCarousel
          images={images}
          onImageSelect={setSelectedImage}
          selectedImage={selectedImage}
        />
      ) : (
        <div className="flex w-full sm:w-1/4 sm:mr-4">
          <img src={result.cover_image} alt="Album cover" className="w-full sm:w-auto" />
        </div>
      )}
      <div className="flex flex-col w-full sm:w-3/4">
        <span className="flex mb-4">
          <ResultIcon type={result.type} />
          <span className="ml-2">
            {result.title} - {result.type}
          </span>
        </span>
        {result.year && (
          <span className="flex mb-4">
            <CalendarDays />
            <span className="ml-2">{result.year}</span>
          </span>
        )}
        {result.genre && (
          <span className="flex mb-4">
            <AdjustmentsHorizontal />
            <span className="ml-2">{result.genre.join(", ")}</span>
          </span>
        )}
        {result.format && (
          <span className="flex mb-4">
            <InformationCircle />
            <span className="ml-2">{result.format.join(", ")}</span>
          </span>
        )}
        <div>
          <Button
            label="Add"
            onClick={() => handleButtonClick(result.id)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

const Pagination = () => {
  const $searchState = useStore(searchState);
  const $searchQuery = useStore(searchQuery);
  const { pagination } = $searchState;
  const [isLoading, setIsLoading] = useState(false);

  if (pagination.pages <= 1) return null;

  const handlePageChange = async (page: number) => {
    setIsLoading(true);
    const res = await fetch(
      `/api/discogs/search?q=${encodeURIComponent($searchQuery)}&page=${page}`
    );
    const results = await res.json();
    searchState.set(results);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentPage = pagination.page;
  const totalPages = pagination.pages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-4">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="px-2 sm:px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
      >
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
      </button>

      {getPageNumbers().map((page, idx) =>
        typeof page === "string" ? (
          <span key={`ellipsis-${idx}`} className="px-2">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="px-2 sm:px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
      >
        Next
      </button>

      {isLoading && (
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading...</span>
      )}
    </div>
  );
};

export const SearchResults = () => {
  const $searchState = useStore(searchState);
  return (
    <div>
      {$searchState.results.length > 0 && (
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Page {$searchState.pagination.page} of {$searchState.pagination.pages} ({$searchState.pagination.items} results)
          </div>
          {$searchState.results.map((result) => (
            <ResultItem result={result} key={result.id} />
          ))}
          <Pagination />
        </div>
      )}
    </div>
  );
};
