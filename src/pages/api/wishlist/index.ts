import type { APIRoute } from "astro";
import { getWishlist } from "../../../db/wishlist";

export const GET: APIRoute = async () => {
  try {
    const wishlistItems = await getWishlist();
    return new Response(JSON.stringify(wishlistItems), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch wishlist" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
