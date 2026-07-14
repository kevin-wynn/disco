import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { albums } from "../../db/schema.js";

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, format, country, label, releasedDate, totalDuration, trackCount } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: "Album ID is required" }), {
        status: 400,
      });
    }

    const albumIdNum = parseInt(id);
    if (isNaN(albumIdNum)) {
      return new Response(JSON.stringify({ error: "Invalid album ID" }), {
        status: 400,
      });
    }

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
      return new Response(JSON.stringify({ error: "Album not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Album updated successfully",
        albumId: albumIdNum,
        updateData,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating album:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
