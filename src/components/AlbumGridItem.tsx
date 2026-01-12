import type { Album, Artist } from "../types/album";
import { sanitizeArtistName } from "../util/string";

type GridSize = "small" | "medium" | "large";

const sizeClasses: Record<GridSize, { title: string; artist: string }> = {
  small: { title: "text-[10px]", artist: "text-[9px]" },
  medium: { title: "text-sm", artist: "text-xs" },
  large: { title: "text-base", artist: "text-sm" },
};

export const AlbumGridItem = ({
  album,
  artists,
  size = "medium",
}: {
  album: Album;
  artists: Artist[] | Artist | null;
  size?: GridSize;
}) => {
  const classes = sizeClasses[size];

  return (
    <a
      href={`/album/${album.id?.toString()}`}
      className="w-full flex justify-center align-middle flex-col"
    >
      <img src={album.imageUrl} alt={album.title} className="w-full aspect-square object-cover mb-2" />
      <span className={`font-bold uppercase ${classes.title}`}>{album.title}</span>
      <span className={`mb-4 text-gray-400 ${classes.artist}`}>
        {artists && !Array.isArray(artists)
          ? sanitizeArtistName(artists.name)
          : artists?.map((artist) => sanitizeArtistName(artist.name))}
      </span>
    </a>
  );
};
