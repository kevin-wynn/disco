import { useState } from "react";
import { Button } from "./Button";

interface SimilarAlbumItemProps {
  album: {
    id: number;
    title: string;
    artist: string;
    year?: string;
    imageUrl?: string;
    source: 'collection' | 'discogs';
    type?: string;
  };
}

export const SimilarAlbumItem = ({ album }: SimilarAlbumItemProps) => {
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [showSuccess, setShowSuccess] = useState<'collection' | 'wishlist' | null>(null);

  const handleAddToCollection = async () => {
    if (album.source === 'collection') {
      // Album is already in collection
      return;
    }

    setIsAddingToCollection(true);
    try {
      // /api/album expects the full Discogs master payload (main_release,
      // tracklist, etc.), so fetch the master details before saving.
      const masterRes = await fetch(`/api/discogs/master?id=${album.id}`);
      const masterData = await masterRes.json();

      const res = await fetch("/api/album", {
        method: "POST",
        body: JSON.stringify({
          ...masterData,
          selectedImageUrl: album.imageUrl,
        }),
      });

      const json = await res.json();
      if (json.albumId) {
        setShowSuccess('collection');
        setTimeout(() => setShowSuccess(null), 2000);
      }
    } catch (error) {
      console.error("Error adding to collection:", error);
    } finally {
      setIsAddingToCollection(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (album.source === 'collection') {
      // Album is already in collection, just add to wishlist if needed
      return;
    }

    setIsAddingToWishlist(true);
    try {
      const res = await fetch("/api/wishlist/add", {
        method: "POST",
        body: JSON.stringify({
          discogsId: album.id,
          resultType: album.type || 'release',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowSuccess('wishlist');
        setTimeout(() => setShowSuccess(null), 2000);
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors">
      <div className="flex gap-3">
        {album.imageUrl && (
          <img
            src={album.imageUrl}
            alt={album.title}
            className="w-16 h-16 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate">{album.title}</h4>
          {album.artist && (
            <p className="text-gray-400 text-xs truncate">{album.artist}</p>
          )}
          {album.year && (
            <p className="text-gray-500 text-xs">{album.year}</p>
          )}
          <div className="flex gap-1 mt-2">
            <span className={`text-xs px-2 py-1 rounded ${
              album.source === 'collection' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}>
              {album.source === 'collection' ? 'In Collection' : 'Discover'}
            </span>
          </div>
        </div>
      </div>
      
      {showSuccess && (
        <div className={`mt-2 text-xs p-2 rounded ${
          showSuccess === 'collection' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          ✓ Added to {showSuccess === 'collection' ? 'Collection' : 'Wishlist'}
        </div>
      )}
      
      <div className="flex gap-2 mt-3">
        {album.source !== 'collection' && (
          <>
            <Button
              onClick={handleAddToCollection}
              isLoading={isAddingToCollection}
              label="Add"
              className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700"
            />
            <Button
              onClick={handleAddToWishlist}
              isLoading={isAddingToWishlist}
              label="Wishlist"
              className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700"
            />
          </>
        )}
        {album.source === 'collection' && (
          <span className="text-xs text-gray-500">Already in collection</span>
        )}
      </div>
    </div>
  );
};
