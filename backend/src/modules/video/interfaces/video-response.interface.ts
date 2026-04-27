export interface VideoResponse {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  type: 'movie' | 'tv_show';
  genres: string[];
  categories: string[];
  language: string;
  ageRating: string;
  releaseYear?: number;
  isFeatured: boolean;
  isPublished: boolean;
  views: number;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}
