import { useEffect, useState } from "react";
import type { Wishlist } from "../db/schema";

export const WishlistResults = () => {
  const [wishlistItems, setWishlistItems] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist");
      const items = await res.json();
      setWishlistItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: number) => {
    try {
      await fetch(`/api/wishlist/${wishlistId}`, { method: "DELETE" });
      await loadWishlist(); // Reload the wishlist
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  const addToCollection = async (wishlistItem: Wishlist) => {
    try {
      // This would add the album to the main collection
      // For now, we'll just remove it from wishlist
      await removeFromWishlist(wishlistItem.id);
    } catch (error) {
      console.error("Error adding to collection:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-white">Loading wishlist...</div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          Your wishlist is empty. Search for albums above to add them!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">
        Wishlist ({wishlistItems.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-white font-semibold text-lg mb-1">
                {item.title}
              </h3>
              <p className="text-gray-400 mb-2">{item.artist}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {item.year && (
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                    {item.year}
                  </span>
                )}
                {item.format && (
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                    {item.format}
                  </span>
                )}
              </div>
              {item.notes && (
                <p className="text-gray-400 text-sm mb-3 italic">
                  {item.notes}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => addToCollection(item)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Add to Collection
                </button>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
