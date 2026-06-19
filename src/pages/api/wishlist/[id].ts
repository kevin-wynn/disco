import type { APIRoute } from "astro";
import { removeFromWishlist } from "../../../db/wishlist";

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const wishlistId = parseInt(params.id!);
    if (isNaN(wishlistId)) {
      return new Response(JSON.stringify({ error: "Invalid wishlist ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const success = await removeFromWishlist({ wishlistId });
    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Wishlist item not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return new Response(JSON.stringify({ error: "Failed to remove from wishlist" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
