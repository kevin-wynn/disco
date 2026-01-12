export type Album = {
  id?: number;
  title: string;
  year: string;
  discogsId: number;
  genres: string;
  styles: string;
  imageUrl: string;
  deletedAt?: number;
  artistId: number;
  artist?: Artist;
};

export type Track = {
  id?: number;
  title: string;
  duration: string;
  albumId: number;
  deletedAt?: number;
};

export type Artist = {
  id?: number;
  name: string;
  imageUrl: string;
  deletedAt?: number;
  discogsId: number;
};

export type DiscogsArtist = {
  id?: number;
  name: string;
  thumbnail_url: string;
};

export type GridData = {
  albums: Album;
  artists: Artist[] | Artist | null;
}[];
