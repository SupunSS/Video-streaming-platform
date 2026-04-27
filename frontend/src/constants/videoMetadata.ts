export const VIDEO_TYPES = [
  { label: "Movie", value: "movie" },
  { label: "TV Show", value: "tv_show" },
] as const;

export const VIDEO_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "History",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Family",
] as const;

export const VIDEO_CATEGORIES = [
  "Trending Now",
  "New Releases",
  "Popular on Flux",
  "Top Picks",
  "Recommended",
  "Award Winners",
  "Family",
  "Binge Worthy",
  "Continue Watching",
  "Coming Soon",
] as const;

export const AGE_RATINGS = [
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
  "TV-Y",
  "TV-G",
  "TV-PG",
  "TV-14",
  "TV-MA",
] as const;
