import { useState } from "react";
import { Button } from "./Button";
import { searchState, searchStateDefault, searchQuery } from "../store/Search";

export const SearchBar = () => {
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    searchState.set(searchStateDefault);
    searchQuery.set(query);
    const res = await fetch(`/api/discogs/search?q=${encodeURIComponent(query)}`);
    const results = await res.json();
    searchState.set(results);
  };

  return (
    <div className="flex flex-col w-full mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            defaultValue=""
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
