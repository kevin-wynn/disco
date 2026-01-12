import { atom, map } from "nanostores";
import type { SearchType } from "../types/search";

export const searchStateDefault: SearchType = {
  results: [],
  pagination: {
    items: 0,
    page: 0,
    pages: 0,
    per_page: 0,
    urls: {
      last: "",
      next: "",
    },
  },
};

export const searchState = map<SearchType>(searchStateDefault);
export const searchQuery = atom<string>("");
