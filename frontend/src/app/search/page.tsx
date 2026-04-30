'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiFilter, FiGrid, FiSearch } from 'react-icons/fi';
import { Navbar } from '@/components/layout/Navbar';
import { VideoCard } from '@/components/video/VideoCard';
import { useVideos } from '@/features/video/useVideos';
import { API_CONFIG } from '@/config/api.config';
import { Video } from '@/types/video.types';
import { VideoResponse } from '@/services/video.service';

const BASE_URL = API_CONFIG.BASE_URL;
const SEARCH_FILTERS_RESET_EVENT = 'search-filters-reset';

const genreFallbacks = ['Action', 'Thriller', 'Drama', 'Sci-Fi', 'Fantasy', 'Crime'];

const buildUrl = (url: string) => (url.startsWith('http') ? url : `${BASE_URL}${url}`);

const normalize = (value: string) => value.trim().toLowerCase();

const getSelectedGenres = (searchParams: URLSearchParams) =>
  Array.from(
    new Set(
      searchParams
        .getAll('genre')
        .flatMap((genre) => genre.split(','))
        .map((genre) => genre.trim())
        .filter((genre) => genre && genre !== 'All'),
    ),
  );

const getVideoGenres = (video: VideoResponse, index: number) =>
  video.genres && video.genres.length > 0
    ? video.genres
    : [genreFallbacks[index % genreFallbacks.length]];

const mapToVideo = (video: VideoResponse, index: number): Video => {
  const genres = getVideoGenres(video, index);

  return {
    id: video._id,
    title: video.title,
    description: video.description || '',
    thumbnail: buildUrl(video.posterUrl || video.thumbnailUrl),
    thumbnailUrl: video.thumbnailUrl,
    posterUrl: video.posterUrl,
    type: video.type ?? 'movie',
    categories: video.categories ?? [],
    language: video.language,
    ageRating: video.ageRating,
    releaseYear: video.releaseYear,
    isFeatured: video.isFeatured,
    seriesTitle: video.seriesTitle,
    seasonNumber: video.seasonNumber,
    episodeNumber: video.episodeNumber,
    episodeTitle: video.episodeTitle,
    duration: video.duration || 0,
    views: video.views || 0,
    channel: video.ownerId?.username || 'FLUX Creator',
    uploadedAt: new Date(video.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    hlsUrl: buildUrl(video.videoUrl),
    status: 'ready',
    rating:
      (video.ratingsCount ?? 0) > 0 && typeof video.averageRating === 'number'
        ? Number(video.averageRating.toFixed(1))
        : null,
    year: video.releaseYear ?? 2024 - (index % 4),
    genre: genres[0],
    genres,
    progress: ((index + 2) * 11) % 85,
  };
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { videos: rawVideos, loading } = useVideos();

  const query = searchParams.get('q')?.trim() ?? '';
  const selectedGenres = useMemo(
    () => getSelectedGenres(searchParams),
    [searchParams],
  );

  const videos = useMemo(
    () => rawVideos.map((video, index) => mapToVideo(video, index)),
    [rawVideos],
  );

  const filteredVideos = useMemo(() => {
    const normalizedQuery = normalize(query);
    const normalizedGenres = selectedGenres.map(normalize);

    return videos.filter((video) => {
      const videoGenres = (video.genres ?? [video.genre ?? '']).filter(Boolean);
      const searchableText = [
        video.title,
        video.description,
        video.channel,
        video.genre,
        ...videoGenres,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesGenre =
        normalizedGenres.length === 0 ||
        videoGenres.some((genre) => normalizedGenres.includes(normalize(genre)));

      return matchesQuery && matchesGenre;
    });
  }, [query, selectedGenres, videos]);

  const hasFilters = query || selectedGenres.length > 0;

  return (
    <main className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/65 backdrop-blur-xl">
              <FiSearch className="text-sky-300" />
              Search Results
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              {hasFilters ? 'Filtered titles' : 'All titles'}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
              {loading
                ? 'Loading matching videos...'
                : `${filteredVideos.length} of ${videos.length} titles match your current search and genre filters.`}
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event(SEARCH_FILTERS_RESET_EVENT));
                router.replace('/search');
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/[0.12] hover:text-white"
            >
              <FiFilter className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        {selectedGenres.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-white" />
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                enableHoverDetails
                onClick={() => router.push(`/video/${video.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-16 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <FiGrid className="h-6 w-6 text-white/60" />
            </div>
            <h2 className="text-2xl font-bold text-white">No matches found</h2>
            <p className="mt-3 text-white/55">
              Try removing a genre or searching with a different title.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cyber-gradient text-white">
          <Navbar />
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-white" />
          </div>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
