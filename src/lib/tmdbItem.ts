import type { TmdbRawResult } from "@/lib/services/tmdb";

export type MediaType = "movie" | "tv";

export interface TmdbItem {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  posterPath: string | null;
  year: string;
  voteAverage: number;
  overview: string;
}

export function mapTmdb(r: TmdbRawResult, mediaType: MediaType): TmdbItem {
  return {
    id: r.id,
    mediaType,
    title: (mediaType === "movie" ? r.title : r.name) ?? "",
    originalTitle: (mediaType === "movie" ? r.original_title : r.original_name) ?? "",
    posterPath: r.poster_path,
    year: (mediaType === "movie" ? r.release_date : r.first_air_date)?.slice(0, 4) ?? "",
    voteAverage: r.vote_average,
    overview: r.overview ?? "",
  };
}
