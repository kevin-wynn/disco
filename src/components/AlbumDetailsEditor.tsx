import { useState } from "react";
import type { AlbumData } from "./AlbumWithTracks";

// Duration validation and formatting utilities (same as AlbumWithTracks)
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

interface AlbumDetailsEditorProps {
  album: AlbumData;
  onUpdate: (updatedData: Partial<AlbumData>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const formatOptions = [
  { value: "", label: "Select format..." },
  { value: "CD", label: "CD" },
  { value: "Vinyl", label: "Vinyl" },
  { value: "Cassette", label: "Cassette" },
  { value: "Digital", label: "Digital" },
  { value: "CD, Album", label: "CD, Album" },
  { value: "Vinyl, LP", label: "Vinyl, LP" },
  { value: 'Vinyl, 12"', label: 'Vinyl, 12"' },
  { value: 'Vinyl, 10"', label: 'Vinyl, 10"' },
  { value: 'Vinyl, 7"', label: 'Vinyl, 7"' },
  { value: "CD, Compilation", label: "CD, Compilation" },
  { value: "Vinyl, Compilation", label: "Vinyl, Compilation" },
  { value: "Digital File", label: "Digital File" },
  { value: "Streaming", label: "Streaming" },
  { value: "Other", label: "Other" },
];

export const AlbumDetailsEditor = ({
  album,
  onUpdate,
  onCancel,
  isOpen,
}: AlbumDetailsEditorProps) => {
  const [formData, setFormData] = useState({
    format: album.format || "",
    country: album.country || "",
    label: album.label || "",
    releasedDate: album.releasedDate || "",
    totalDuration: album.totalDuration || "",
    trackCount: album.trackCount?.toString() || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [durationError, setDurationError] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear duration error when user starts typing
    if (field === "totalDuration") {
      setDurationError("");
    }
  };

  const validateAndSave = async () => {
    // Validate total duration format
    if (
      formData.totalDuration &&
      !validateDurationFormat(formData.totalDuration)
    ) {
      setDurationError(
        "Duration must be in MM:SS or H:MM:SS format (e.g., 3:45 or 1:23:45)",
      );
      return;
    }

    await handleSave();
  };

  const handleSave = async () => {
    if (!album?.id) return;

    setIsSaving(true);
    try {
      const updateData = {
        id: album.id,
        format: formData.format || null,
        country: formData.country || null,
        label: formData.label || null,
        releasedDate: formData.releasedDate || null,
        totalDuration: formData.totalDuration
          ? normalizeDuration(formData.totalDuration)
          : null,
        trackCount: formData.trackCount ? parseInt(formData.trackCount) : null,
      };

      const response = await fetch("/api/album-details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update album details");
      }

      const result = await response.json();

      // Update local state
      onUpdate({
        format: updateData.format,
        country: updateData.country,
        label: updateData.label,
        releasedDate: updateData.releasedDate,
        totalDuration: updateData.totalDuration,
        trackCount: updateData.trackCount,
      });

      console.log("Album details updated successfully:", result);
    } catch (error) {
      console.error("Error updating album details:", error);
      alert("Failed to update album details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Edit Album Details: {album.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => handleInputChange("format", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              placeholder="e.g., US, UK, JP"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => handleInputChange("label", e.target.value)}
              placeholder="e.g., Sony Music, Warner Bros"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Released Date
            </label>
            <input
              type="text"
              value={formData.releasedDate}
              onChange={(e) =>
                handleInputChange("releasedDate", e.target.value)
              }
              placeholder="e.g., 2017-09-22"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Duration
            </label>
            <input
              type="text"
              value={formData.totalDuration}
              onChange={(e) =>
                handleInputChange("totalDuration", e.target.value)
              }
              placeholder="e.g., 44:10 or 1:23:45"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                durationError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {durationError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {durationError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Track Count
            </label>
            <input
              type="number"
              value={formData.trackCount}
              onChange={(e) => handleInputChange("trackCount", e.target.value)}
              placeholder="e.g., 13"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={validateAndSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded transition-colors"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
