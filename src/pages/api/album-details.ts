import type { LoggySpan } from "@loggydev/loggy-node/dist/tracing/span";
import type { APIRoute } from "astro";
import { db } from "../../db/index.js";
import { albums } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { apiTracer, loggy } from "../../util/loggy.js";

export const PUT: APIRoute = async ({ request }) => {
  const parentContext = apiTracer.extract(Object.fromEntries(request.headers));

  const rootSpan = apiTracer.startSpan("album.update", {
    kind: "server",
    parent: parentContext,
    attributes: { "http.method": "PUT", "http.route": "/api/album/details" },
  });

  try {
    const data = await request.json();
    const { id, format, country, label, releasedDate, totalDuration, trackCount } = data;

    if (!id) {
      loggy.error("Missing album ID in update request", {
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Missing album ID");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Album ID is required" }), {
        status: 400,
      });
    }

    const albumIdNum = parseInt(id);
    if (isNaN(albumIdNum)) {
      loggy.error("Invalid album ID in update request", {
        albumId: id,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Invalid album ID");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Invalid album ID" }), {
        status: 400,
      });
    }

    loggy.info("Processing album update request", {
      albumId: albumIdNum,
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });

    // Prepare update data with only provided fields
    const updateData: any = {};
    if (format !== undefined) updateData.format = format;
    if (country !== undefined) updateData.country = country;
    if (label !== undefined) updateData.label = label;
    if (releasedDate !== undefined) updateData.releasedDate = releasedDate;
    if (totalDuration !== undefined) updateData.totalDuration = totalDuration;
    if (trackCount !== undefined) updateData.trackCount = trackCount;

    const result = await db
      .update(albums)
      .set(updateData)
      .where(eq(albums.id, albumIdNum));

    if (result.changes === 0) {
      loggy.warn("Album not found for update", {
        albumId: albumIdNum,
        traceId: rootSpan.context.traceId,
        spanId: rootSpan.context.spanId,
      });
      rootSpan.setStatus("error", "Album not found");
      rootSpan.end();
      return new Response(JSON.stringify({ error: "Album not found" }), {
        status: 404,
      });
    }

    rootSpan.setStatus("ok");
    rootSpan.end();

    loggy.info("Album updated successfully", {
      albumId: albumIdNum,
      updateData,
      traceId: rootSpan.context.traceId,
      spanId: rootSpan.context.spanId,
    });

    return new Response(
      JSON.stringify({
        message: "Album updated successfully",
        albumId: albumIdNum,
        updateData,
      }),
      { status: 200 },
    );
  } catch (error) {
    loggy.error("Error updating album", {
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
