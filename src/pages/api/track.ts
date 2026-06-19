import type { APIRoute } from "astro";
import { updateTrackDuration } from "../../db/albums";
import { apiTracer, loggy } from "../../util/loggy";

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
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const rootSpan = apiTracer.startSpan("track.update_duration", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "PUT", "http.route": "/api/track" },
  });

  try {
    const data = await request.json();
    const { trackId, duration } = data;

    if (!trackId || duration === undefined) {
      loggy.error("Missing trackId or duration in update request", {
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
        trackId,
        duration,
      });
      rootSpan.setStatus("error", "Missing required fields");
      rootSpan.end();
      return new Response(
        JSON.stringify({ error: "Track ID and duration are required" }),
        { status: 400 }
      );
    }

    const trackIdNum = parseInt(trackId);
    if (isNaN(trackIdNum)) {
      loggy.error("Invalid track ID in update request", {
        trackId,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Invalid track ID");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Invalid track ID" }), {
        status: 400,
      });
    }

    if (typeof duration !== "string") {
      loggy.error("Invalid duration type in update request", {
        duration: typeof duration,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Invalid duration type");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Duration must be a string" }), {
        status: 400,
      });
    }

    // Validate duration format
    if (!validateDurationFormat(duration)) {
      loggy.error("Invalid duration format in update request", {
        duration,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Invalid duration format");
      rootSpan.end();
      return new Response(
        JSON.stringify({
          error: "Duration must be in MM:SS or H:MM:SS format (e.g., 3:45 or 1:23:45)",
        }),
        { status: 400 }
      );
    }

    // Normalize duration
    const normalizedDuration = normalizeDuration(duration);

    loggy.info("Processing track duration update request", {
      trackId: trackIdNum,
      duration: normalizedDuration,
      originalDuration: duration,
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });

    const updated = await updateTrackDuration({
      trackId: trackIdNum,
      duration: normalizedDuration,
      parentSpan: rootSpan,
    });

    if (!updated) {
      loggy.warn("Track not found for duration update", {
        trackId: trackIdNum,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Track not found");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404,
      });
    }

    rootSpan.setStatus("ok");
    rootSpan.end();

    loggy.info("Track duration updated successfully", {
      trackId: trackIdNum,
      duration: normalizedDuration,
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });

    return new Response(
      JSON.stringify({
        message: "Track duration updated successfully",
        trackId: trackIdNum,
        duration: normalizedDuration,
      }),
      { status: 200 }
    );
  } catch (error) {
    loggy.error("Error updating track duration", {
      error: String(error),
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });
    rootSpan.setStatus("error", String(error));
    rootSpan.end();
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
