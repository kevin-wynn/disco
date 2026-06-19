import type { Album, Artist } from "../types/album";
import { sanitizeArtistName } from "../util/string";

type GridSize = "small" | "medium" | "large";

const sizeClasses: Record<GridSize, { title: string; artist: string }> = {
  small: { title: "text-[8px]", artist: "text-[7px]" },
  medium: { title: "text-[10px]", artist: "text-[9px]" },
  large: { title: "text-xs", artist: "text-[10px]" },
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
      className="w-full flex justify-center items-start flex-col"
    >
      <img
        src={album.imageUrl}
        alt={album.title}
        className="w-full aspect-square object-cover mb-1"
      />
      <span
        className={`font-bold uppercase ${classes.title} leading-tight line-clamp-2`}
      >
        {album.title}
      </span>
      <span
        className={`text-gray-400 ${classes.artist} leading-tight line-clamp-1`}
      >
        {artists && !Array.isArray(artists)
          ? sanitizeArtistName(artists.name)
          : artists?.map((artist) => sanitizeArtistName(artist.name))}
      </span>
    </a>
  );
};
