export interface VideoUser {
  username: string;
  avatar?: string;
}

export interface Video {
  _id?: string;
  id: string;
  title: string;
  description?: string;

  videoUrl?: string;
  hlsUrl?: string;

  thumbnail: string;
  thumbnailUrl?: string;
  posterUrl?: string;

  type?: "movie" | "tv_show";
  genres?: string[];
  categories?: string[];
  language?: string;
  ageRating?: string;
  releaseYear?: number;
  isFeatured?: boolean;

  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;

  duration?: number;
  views?: number;
  channel?: string;

  createdAt?: string;
  updatedAt?: string;
  uploadedAt?: string;

  status?: "processing" | "ready" | "failed";

  user?: VideoUser;

  rating?: number | string | null;
  ratingsCount?: number;
  averageRating?: number;
  myRating?: number | null;
  isNew?: boolean;
  progress?: number;
  genre?: string;
  year?: number | string;
}
