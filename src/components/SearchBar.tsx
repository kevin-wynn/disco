import { useState } from "react";
import { searchQuery, searchState, searchStateDefault } from "../store/Search";
import { Button } from "./Button";

export const SearchBar = () => {
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return; // Don't search if empty

    searchState.set(searchStateDefault);
    searchQuery.set(query);
    try {
      const res = await fetch(
        `/api/discogs/search?q=${encodeURIComponent(query)}`,
      );

      if (res.status === 429) {
        console.error(
          "Discogs API rate limit exceeded. Please wait a moment before searching again.",
        );
        // Optionally show a user-friendly message
        return;
      }

      const results = await res.json();
      searchState.set(results);
    } catch (error) {
      console.error("Search error:", error);
      // Reset to default state on error
      searchState.set(searchStateDefault);
    }
  };

  return (
    <div className="flex flex-col w-full mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            value={query}
            placeholder="Search for releases..."
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            type="text"
            className="bg-white py-2 px-6 rounded-full outline-none border-2 border-gray-300 w-full text-gray-800 placeholder-gray-400"
          />
        </div>
        <div className="flex sm:w-auto">
          <Button onClick={handleSearch} label="Search" />
        </div>
      </div>
    </div>
  );
};
