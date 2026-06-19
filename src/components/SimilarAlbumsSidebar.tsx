import { useEffect, useState } from "react";
import { SimilarAlbumItem } from "./SimilarAlbumItem";

interface SimilarAlbumsSidebarProps {
  albumId?: number;
  artistId?: number;
  artistName?: string;
  genres?: string;
  year?: string;
  title?: string;
}

export const SimilarAlbumsSidebar = ({
  albumId,
  artistId,
  artistName,
  genres,
  year,
  title,
}: SimilarAlbumsSidebarProps) => {
  const [similarAlbums, setSimilarAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (albumId || artistId || artistName) {
      loadSimilarAlbums();
    }
  }, [albumId, artistId, artistName, genres, year]);

  const loadSimilarAlbums = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (albumId) params.append('albumId', albumId.toString());
      if (artistId) params.append('artistId', artistId.toString());
      if (artistName) params.append('artistName', artistName);
      if (genres) params.append('genres', genres);
      if (year) params.append('year', year);

      const res = await fetch(`/api/similar-albums?${params.toString()}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSimilarAlbums(data.albums || []);
      }
    } catch (err) {
      console.error('Error loading similar albums:', err);
      setError('Failed to load similar albums');
    } finally {
      setLoading(false);
    }
  };

  if (!albumId && !artistId && !artistName) {
    return null;
  }

  return (
    <div className="w-80 bg-gray-900 rounded-lg p-4 h-fit">
      <h3 className="text-white font-semibold mb-4">
        Similar Albums
      </h3>
      
      {loading && (
        <div className="text-gray-400 text-sm">Loading similar albums...</div>
      )}
      
      {error && (
        <div className="text-red-400 text-sm mb-4">{error}</div>
      )}
      
      {!loading && !error && similarAlbums.length === 0 && (
        <div className="text-gray-400 text-sm">
          No similar albums found for {title || 'this album'}.
        </div>
      )}
      
      <div className="space-y-3">
        {similarAlbums.map((album) => (
          <SimilarAlbumItem key={`${album.source}-${album.id}`} album={album} />
        ))}
      </div>
    </div>
  );
};
