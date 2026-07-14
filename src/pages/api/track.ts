import type { APIRoute } from "astro";
import { updateTrackDuration } from "../../db/albums";

// Validate duration format (supports M:SS or MM:SS or H:MM:SS or HH:MM:SS)
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

// Normalize duration format (convert H:MM:SS to MM:SS if needed)
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { trackId, duration } = data;

    if (!trackId || duration === undefined) {
      return new Response(
        JSON.stringify({ error: "Track ID and duration are required" }),
        { status: 400 },
      );
    }

    const trackIdNum = parseInt(trackId);
    if (isNaN(trackIdNum)) {
      return new Response(JSON.stringify({ error: "Invalid track ID" }), {
        status: 400,
      });
    }

    if (typeof duration !== "string") {
      return new Response(
        JSON.stringify({ error: "Duration must be a string" }),
        { status: 400 },
      );
    }

    // Validate duration format
    if (!validateDurationFormat(duration)) {
      return new Response(
        JSON.stringify({
          error:
            "Duration must be in MM:SS or H:MM:SS format (e.g., 3:45 or 1:23:45)",
        }),
        { status: 400 },
      );
    }

    // Normalize duration
    const normalizedDuration = normalizeDuration(duration);

    const updated = await updateTrackDuration({
      trackId: trackIdNum,
      duration: normalizedDuration,
    });

    if (!updated) {
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Track duration updated successfully",
        trackId: trackIdNum,
        duration: normalizedDuration,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating track duration:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
