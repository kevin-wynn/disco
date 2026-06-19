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
  format?: string;
  country?: string;
  label?: string;
  releasedDate?: string;
  totalDuration?: string;
  trackCount?: number;
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
  profile?: string;
  urls?: string[];
  nameVariations?: string[];
  members?: ArtistMember[];
  dataQuality?: string;
};

export type DiscogsArtist = {
  id?: number;
  name: string;
  thumbnail_url: string;
};

export type ArtistMember = {
  active: boolean;
  id: number;
  name: string;
  resource_url: string;
};

export type GridData = {
  albums: Album;
  artists: Artist[] | Artist | null;
}[];
