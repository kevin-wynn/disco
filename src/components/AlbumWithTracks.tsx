import { useRef, useState } from "react";
import type { Album, Artist, Track } from "../db/schema";
import { sanitizeArtistName } from "../util/string";
import { AlbumDetailsEditor } from "./AlbumDetailsEditor";
import { SimilarAlbumsSidebar } from "./SimilarAlbumsSidebar";

export interface AlbumData extends Album {
  artists: Artist[] | Artist | null;
  tracks: Track[] | null;
}

export const AlbumWithTracks = ({ album }: { album: AlbumData }) => {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [editingDuration, setEditingDuration] = useState("");
  const [isUpdatingDuration, setIsUpdatingDuration] = useState(false);
  const durationInputRef = useRef<HTMLInputElement>(null);

  // Duration validation and formatting utilities
  const validateDurationFormat = (duration: string): boolean => {
    const trimmed = duration.trim();

    // Allow empty string
    if (trimmed === "") return true;

    // Check for MM:SS format (most common)
    const mmSsPattern = /^\d{1,2}:\d{2}$/;
    if (mmSsPattern.test(trimmed)) return true;

    // Check for H:MM:SS or HH:MM:SS format
    const hMmSsPattern = /^\d{1,2}:\d{2}:\d{2}$/;
    if (hMmSsPattern.test(trimmed)) return true;

    return false;
  };

  const normalizeDuration = (duration: string): string => {
    const trimmed = duration.trim();

    if (trimmed === "") return "";

    // If it's already MM:SS format, return as-is
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;

    // Convert H:MM:SS to MM:SS format
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
      const parts = trimmed.split(":");
      if (parts.length === 3) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parts[2];

        const totalMinutes = hours * 60 + minutes;
        return `${totalMinutes}:${seconds}`;
      }
    }

    return trimmed;
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDeleteAlbum = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/album/${album.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error deleting album:", error);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const handleEditDetails = () => {
    setIsEditingDetails(true);
  };

  const handleUpdateDetails = (updatedData: Partial<AlbumData>) => {
    // Update the album data with the new values
    Object.assign(album, updatedData);
    setIsEditingDetails(false);
  };

  const handleCancelEdit = () => {
    setIsEditingDetails(false);
  };

  const startEditingDuration = (track: Track) => {
    setEditingTrackId(track.id);
    setEditingDuration(track.duration || "");
    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 0);
  };

  const saveEditedDuration = async (track: Track) => {
    if (!validateDurationFormat(editingDuration)) {
      alert("Please enter a valid duration format (MM:SS or H:MM:SS)");
      return;
    }

    setIsUpdatingDuration(true);
    try {
      const normalizedDuration = normalizeDuration(editingDuration);
      const res = await fetch(`/api/track/${track.id}`, {
        method: "PUT",
        body: JSON.stringify({ duration: normalizedDuration }),
      });

      if (res.ok) {
        // Update the track in the local state
        if (album.tracks) {
          const trackIndex = album.tracks.findIndex((t) => t.id === track.id);
          if (trackIndex !== -1) {
            album.tracks[trackIndex].duration = normalizedDuration;
          }
        }
        setEditingTrackId(null);
        setEditingDuration("");
      }
    } catch (error) {
      console.error("Error updating track duration:", error);
    } finally {
      setIsUpdatingDuration(false);
    }
  };

  const cancelEditingDuration = () => {
    setEditingTrackId(null);
    setEditingDuration("");
  };

  const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    albumTitle,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    albumTitle: string;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Delete Album
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to delete "{albumTitle}"? This action cannot
            be undone.
          </p>
          <div className="flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="w-full flex flex-col justify-center align-middle">
          <div className="flex flex-col sm:flex-row mb-4 gap-4">
            <div className="w-full sm:w-1/3 flex flex-col">
              <img
                src={album.imageUrl ?? ""}
                alt={album.title ?? ""}
                className="w-full mb-2"
              />
            </div>
            <div className="w-full sm:w-2/3 flex flex-col justify-between">
              <div className="flex flex-col">
                <span className="flex flex-row items-end text-xl sm:text-2xl font-bold uppercase">
                  {album.title}

                  <button
                    onClick={openDeleteModal}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-2 text-sm"
                    disabled={!album?.id || isDeleting}
                    title="Delete album"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </span>
                <span className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                  {Array.isArray(album.artists)
                    ? album.artists[0]?.name || "Unknown Artist"
                    : album.artists?.name || "Unknown Artist"}
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {album.year && (
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                      {album.year}
                    </span>
                  )}
                  {album.genres && (
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                      {album.genres}
                    </span>
                  )}
                  {album.format && (
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                      {album.format}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={handleEditDetails}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit Details
                </button>
              </div>
            </div>
          </div>

          {/* Album Details Section */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Album Details
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {album.artists && !Array.isArray(album.artists) && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Artist:
                  </span>
                  <a
                    href={`/artist/${album.artists.id}`}
                    className="ml-2 text-gray-900 dark:text-gray-100 hover:text-blue-400 dark:hover:text-blue-300 transition-colors underline"
                  >
                    {sanitizeArtistName(album.artists.name ?? "")}
                  </a>
                </div>
              )}
              {album.year && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Year:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {album.year}
                  </span>
                </div>
              )}
              {album.format && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Format:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {album.format}
                  </span>
                </div>
              )}
              {album.label && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Label:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {album.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tracks Section */}
          {album.tracks && album.tracks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Tracks</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-600">
                      <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">
                        #
                      </th>
                      <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">
                        Title
                      </th>
                      <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">
                        Duration
                      </th>
                      <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {album.tracks.map((track, index) => (
                      <tr
                        key={track.id || index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">
                          {track.position ? track.position : index + 1}
                        </td>
                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">
                          {track.title}
                        </td>
                        <td className="py-2 px-4">
                          {editingTrackId === track.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingDuration}
                                onChange={(e) =>
                                  setEditingDuration(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveEditedDuration(track);
                                  } else if (e.key === "Escape") {
                                    cancelEditingDuration();
                                  }
                                }}
                                placeholder="MM:SS or H:MM:SS"
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                ref={durationInputRef}
                              />
                              <button
                                onClick={() => saveEditedDuration(track)}
                                disabled={isUpdatingDuration}
                                className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditingDuration}
                                disabled={isUpdatingDuration}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  track.duration ? "" : "text-gray-400 italic"
                                }
                              >
                                {track.duration || "No duration"}
                              </span>
                              <button
                                onClick={() => startEditingDuration(track)}
                                className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors duration-200"
                                title="Edit duration"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteAlbum}
            albumTitle={album.title || "Unknown Album"}
          />
          <AlbumDetailsEditor
            album={album}
            onUpdate={handleUpdateDetails}
            onCancel={handleCancelEdit}
            isOpen={isEditingDetails}
          />
        </div>
      </div>

      {/* Sidebar - Only on large screens */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <SimilarAlbumsSidebar
          albumId={album.id}
          artistId={album.artistId}
          artistName={
            album.artists && !Array.isArray(album.artists)
              ? album.artists.name || undefined
              : undefined
          }
          genres={album.genres || undefined}
          styles={album.styles || undefined}
          year={album.year || undefined}
          title={album.title || undefined}
        />
      </div>
    </div>
  );
};
