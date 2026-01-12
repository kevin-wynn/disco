import type { Album, Artist, Track } from "../db/schema";
import { sanitizeArtistName } from "../util/string";

export interface AlbumData extends Album {
  artists: Artist[] | Artist | null;
  tracks: Track[] | null;
}

export const AlbumWithTracks = ({ album }: { album: AlbumData }) => {
  return (
    <div className="w-full flex flex-col justify-center align-middle">
      <div className="flex mb-4">
        <div className="w-1/3 flex flex-col mr-4">
          <img src={album.imageUrl ?? ""} alt={album.title ?? ""} className="w-full mb-2" />
        </div>
        <div className="w-2/3 flex flex-col justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold uppercase">{album.title}</span>
            <span className="text-sm text-gray-400">{album.genres}</span>
          </div>
          <div className="mb-2">
            {album.artists && !Array.isArray(album.artists) ? (
              <div>
                <span className="text-md">
                  {sanitizeArtistName(album.artists.name ?? "")}
                </span>
                <img
                  src={album.artists.imageUrl ?? ""}
                  alt={sanitizeArtistName(album.artists?.name ?? "")}
                  className="w-1/4"
                />
              </div>
            ) : (
              // TODO: multiple artists
              <div></div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col">
        <table className="w-3/4 table-auto">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-800">
              <th className="text-left p-2">Song</th>
              <th className="text-left p-2">Duration</th>
            </tr>
          </thead>
          <tbody>
            {album.tracks?.map((track) => (
              <tr key={track.id} className="odd:bg-gray-50 even:bg-gray-100 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                <td className="p-2">{track.title}</td>
                <td className="p-2">{track.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
