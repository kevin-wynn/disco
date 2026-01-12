import type { Track } from "./album";

export type Pagination = {
  items: number;
  page: number;
  pages: number;
  per_page: number;
  urls: {
    last: string;
    next: string;
  };
};

export type Result = {
  id: number;
  type: string;
  cover_image: string;
  title: string;
  year?: string;
  genre?: [string];
  format?: [string];
};

export type ReleaseResult = {
  id: number;
  images: [
    {
      type: string;
      uri: string;
    }
  ];
  title: string;
  year: number;
  genres: [string];
  styles: [string];
  tracklist: [Track];
};

export interface SearchType {
  results: [Result] | [];
  pagination: Pagination;
}
