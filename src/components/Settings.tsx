import { useState, useEffect } from "react";

export const SettingsPanel = () => {
  const [generalOpen, setGeneralOpen] = useState(true);
  const [albumsOpen, setAlbumsOpen] = useState(true);
  const [artistsOpen, setArtistsOpen] = useState(true);
  const [syncOpen, setSyncOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isResyncing, setIsResyncing] = useState(false);
  const [resyncStatus, setResyncStatus] = useState<string | null>(null);
  const [discogsApiToken, setDiscogsApiToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenSaveStatus, setTokenSaveStatus] = useState<string | null>(null);

  // TODO: the resync durations button should trigger a background job to handle resync

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : true;
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Fetch Discogs API token from settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.discogsApiToken) {
          setDiscogsApiToken(data.discogsApiToken);
        }
      })
      .catch(console.error);
  }, []);

  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSaveToken = async () => {
    setIsSavingToken(true);
    setTokenSaveStatus(null);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discogsApiToken }),
      });
      const data = await response.json();
      if (data.success) {
        setTokenSaveStatus("API token saved successfully");
      } else {
        setTokenSaveStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setTokenSaveStatus("Failed to save API token");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleResyncDurations = async () => {
    setIsResyncing(true);
    setResyncStatus(null);
    try {
      const response = await fetch("/api/resync-durations", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setResyncStatus(data.message);
      } else {
        setResyncStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      setResyncStatus("Failed to resync track durations");
    } finally {
      setIsResyncing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <h1 className="font-bold uppercase text-lg mb-6">Settings</h1>

      <div className="divide-y divide-gray-300 dark:divide-gray-700">
        {/* General Section */}
        <div className="py-2">
          <div
            onClick={() => setGeneralOpen(!generalOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer"
          >
            <span className="font-bold uppercase">General</span>
            <span className={`text-xs text-gray-400 inline-block transition-transform duration-300 ${generalOpen ? "rotate-180" : ""}`}>▼</span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${generalOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pb-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="font-bold uppercase text-sm">Theme</span>
                  <span className="text-sm text-gray-400">Enable dark mode</span>
                </div>
                <div
                  onClick={handleThemeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer flex-shrink-0 transition-colors duration-300 ${isDarkMode ? "bg-green-600" : "bg-gray-400"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-300 ${isDarkMode ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
              <div className="flex flex-col py-2">
                <div className="flex flex-col mb-2">
                  <span className="font-bold uppercase text-sm">Discogs API Token</span>
                  <span className="text-sm text-gray-400">Your personal Discogs API token for fetching album data</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="password"
                    value={discogsApiToken}
                    onChange={(e) => setDiscogsApiToken(e.target.value)}
                    placeholder="Enter your Discogs API token"
                    className="bg-white py-2 px-4 sm:px-6 rounded-full outline-none border-2 border-gray-300 w-full text-gray-800 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveToken}
                    disabled={isSavingToken}
                    className={`rounded-full text-white py-2 px-6 flex-shrink-0 ${
                      isSavingToken
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isSavingToken ? "Saving..." : "Save"}
                  </button>
                </div>
                {tokenSaveStatus && (
                  <div className={`mt-2 text-sm ${tokenSaveStatus.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
                    {tokenSaveStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Albums Section */}
        <div className="py-2">
          <div
            onClick={() => setAlbumsOpen(!albumsOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer"
          >
            <span className="font-bold uppercase">Albums</span>
            <span className={`text-xs text-gray-400 inline-block transition-transform duration-300 ${albumsOpen ? "rotate-180" : ""}`}>▼</span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${albumsOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pb-4">
              <span className="text-sm text-gray-400">
                Configure how albums are displayed and organized in your library.
                Additional album settings and customization options will be available here in future updates.
              </span>
            </div>
          </div>
        </div>

        {/* Artists Section */}
        <div className="py-2">
          <div
            onClick={() => setArtistsOpen(!artistsOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer"
          >
            <span className="font-bold uppercase">Artists</span>
            <span className={`text-xs text-gray-400 inline-block transition-transform duration-300 ${artistsOpen ? "rotate-180" : ""}`}>▼</span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${artistsOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pb-4">
              <span className="text-sm text-gray-400">
                Manage artist preferences and display options. Customize how artist information is shown throughout the application and configure artist-related features.
              </span>
            </div>
          </div>
        </div>

        {/* Sync Section */}
        <div className="py-2">
          <div
            onClick={() => setSyncOpen(!syncOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer"
          >
            <span className="font-bold uppercase">Sync</span>
            <span className={`text-xs text-gray-400 inline-block transition-transform duration-300 ${syncOpen ? "rotate-180" : ""}`}>▼</span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${syncOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-3">
                <div className="flex flex-col">
                  <span className="font-bold uppercase text-sm">Resync Track Durations</span>
                  <span className="text-sm text-gray-400">Update track duration information from source</span>
                </div>
                <button
                  type="button"
                  onClick={handleResyncDurations}
                  disabled={isResyncing}
                  className={`rounded-full text-white py-2 px-6 flex-shrink-0 w-full sm:w-auto ${
                    isResyncing
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isResyncing ? "Resyncing..." : "Resync"}
                </button>
              </div>
              {resyncStatus && (
                <div className={`mt-2 text-sm ${resyncStatus.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
                  {resyncStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
