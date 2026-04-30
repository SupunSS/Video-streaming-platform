// frontend/src/app/library/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowRight,
  FiBookmark,
  FiFilm,
  FiGrid,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiTv,
} from 'react-icons/fi';
import { Navbar } from '@/components/layout/Navbar';
import { VideoCard } from '@/components/video/VideoCard';
import { getLibraryVideos } from '@/lib/library';
import { Video } from '@/types/video.types';

type SortKey = 'recent' | 'title' | 'views' | 'rating';
type MediaFilter = 'all' | 'movie' | 'tv_show';

const genreFallbacks = [
  'Action',
  'Drama',
  'Thriller',
  'Sci-Fi',
  'Comedy',
  'Documentary',
  'Fantasy',
  'Crime',
];

function formatViews(views?: number): string {
  const value = views ?? 0;

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${value}`;
}

function formatDuration(duration?: number): string {
  if (!duration || Number.isNaN(duration)) {
    return '—';
  }

  if (duration >= 3600) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  if (duration >= 60) {
    return `${Math.floor(duration / 60)}m`;
  }

  return `${duration}s`;
}

function getNumericRating(rating: Video['rating']): number {
  if (typeof rating === 'number') {
    return rating;
  }

  if (typeof rating === 'string') {
    const parsed = Number(rating);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeVideo(video: Video, index: number): Video {
  return {
    ...video,
    type: video.type ?? 'movie',
    genre: video.genre ?? genreFallbacks[index % genreFallbacks.length],
    year: video.year ?? 2024 - (index % 5),
    rating: video.rating ?? null,
    progress: video.progress ?? ((index * 17) % 82) + 12,
  };
}

function getVideoType(video: Video): 'movie' | 'tv_show' {
  return video.type === 'tv_show' ? 'tv_show' : 'movie';
}

function sortVideos(videos: Video[], sortBy: SortKey): Video[] {
  const sorted = [...videos];

  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    case 'views':
      return sorted.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

    case 'rating':
      return sorted.sort((a, b) => getNumericRating(b.rating) - getNumericRating(a.rating));

    case 'recent':
    default:
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }
}

function SectionRow({
  title,
  subtitle,
  videos,
  showProgress = false,
  onVideoClick,
}: {
  title: string;
  subtitle: string;
  videos: Video[];
  showProgress?: boolean;
  onVideoClick: (videoId: string) => void;
}) {
  if (videos.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-white/50">{subtitle}</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {videos.map((video) => (
          <div
            key={`${title}-${video.id}`}
            className="w-[240px] min-w-[240px] shrink-0 sm:w-[270px] sm:min-w-[270px]"
          >
            <VideoCard
  video={video}
  showProgress={showProgress}
  enableHoverDetails
  onClick={() => onVideoClick(video.id)}
/>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-sm text-white/55">
        <span className="text-sky-300">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur-xl">
      {children}
    </span>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<MediaFilter>('all');
  const [activeGenre, setActiveGenre] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('recent');

  useEffect(() => {
    const loadLibrary = () => {
      const stored = getLibraryVideos();
      setVideos(stored.map(normalizeVideo));
    };

    loadLibrary();
    window.addEventListener('library-updated', loadLibrary);
    window.addEventListener('focus', loadLibrary);

    return () => {
      window.removeEventListener('library-updated', loadLibrary);
      window.removeEventListener('focus', loadLibrary);
    };
  }, []);

  const mediaCounts = useMemo(() => {
    const films = videos.filter((video) => getVideoType(video) === 'movie').length;
    const tvShows = videos.filter((video) => getVideoType(video) === 'tv_show').length;

    return {
      all: videos.length,
      movie: films,
      tv_show: tvShows,
    };
  }, [videos]);

  const typedVideos = useMemo(
    () =>
      activeType === 'all'
        ? videos
        : videos.filter((video) => getVideoType(video) === activeType),
    [activeType, videos],
  );

  const genres = useMemo(() => {
    const uniqueGenres = new Set(
      typedVideos.map((video) => video.genre).filter(Boolean) as string[],
    );
    return ['All', ...Array.from(uniqueGenres)];
  }, [typedVideos]);

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = typedVideos.filter((video) => {
      const matchesQuery =
        !query ||
        video.title.toLowerCase().includes(query) ||
        (video.seriesTitle ?? '').toLowerCase().includes(query) ||
        (video.episodeTitle ?? '').toLowerCase().includes(query) ||
        (video.description ?? '').toLowerCase().includes(query) ||
        (video.channel ?? '').toLowerCase().includes(query) ||
        (video.genre ?? '').toLowerCase().includes(query);

      const matchesGenre = activeGenre === 'All' || video.genre === activeGenre;

      return matchesQuery && matchesGenre;
    });

    return sortVideos(filtered, sortBy);
  }, [typedVideos, search, activeGenre, sortBy]);

  const featuredVideo = filteredVideos[0] ?? videos[0] ?? null;
  const filteredFilms = filteredVideos.filter(
    (video) => getVideoType(video) === 'movie',
  );
  const filteredTvShows = filteredVideos.filter(
    (video) => getVideoType(video) === 'tv_show',
  );

  const continueWatching = filteredVideos
    .filter((video) => {
      const progress = video.progress ?? 0;
      return progress > 0 && progress < 100;
    })
    .slice(0, 10);

  const topRated = [...filteredVideos]
    .sort((a, b) => getNumericRating(b.rating) - getNumericRating(a.rating))
    .slice(0, 10);

  const trending = [...filteredVideos]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 10);

  const watchAgain = filteredVideos.slice(0, 10);

  const stats = useMemo(() => {
    const totalViews = filteredVideos.reduce((sum, video) => sum + (video.views ?? 0), 0);
    const ratedVideos = filteredVideos.filter(
      (video) => video.rating !== null && video.rating !== undefined,
    );
    const avgRating =
      ratedVideos.length > 0
        ? (
            ratedVideos.reduce((sum, video) => sum + getNumericRating(video.rating), 0) /
            ratedVideos.length
          ).toFixed(1)
        : '—';

    return {
      count: filteredVideos.length,
      views: totalViews,
      rating: avgRating,
    };
  }, [filteredVideos]);

  return (
    <main className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,65,194,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(173,216,230,0.10),transparent_25%),linear-gradient(to_bottom,rgba(0,0,0,0.25),rgba(0,0,0,0.72))]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          {featuredVideo ? (
            <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="pt-8 md:pt-12">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
                  <FiBookmark className="text-sky-300" />
                  Your Library
                </div>

                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
                  Pick up where you left off,
                  <span className="bg-gradient-to-r from-white via-sky-300 to-blue-400 bg-clip-text text-transparent">
                    {' '}
                    instantly
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 md:text-lg">
                  A cinematic library page with fast browsing, filters, and direct playback from
                  every saved title.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/video/${featuredVideo.id}`}
                    className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90"
                  >
                    <FiPlay />
                    Play Featured
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setActiveType('all');
                      setActiveGenre('All');
                      setSortBy('recent');
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.08] px-6 py-3 font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.14]"
                  >
                    <FiRefreshCw />
                    Reset Filters
                  </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <StatCard label="Saved titles" value={`${stats.count}`} icon={<FiGrid />} />
                  <StatCard
                    label="Combined views"
                    value={formatViews(stats.views)}
                    icon={<FiTrendingUp />}
                  />
                  <StatCard label="Average rating" value={stats.rating} icon={<FiStar />} />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={featuredVideo.thumbnail}
                    alt={featuredVideo.title}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Pill>{featuredVideo.genre}</Pill>
                      <Pill>{featuredVideo.year ?? '2024'}</Pill>
                      <Pill>{formatDuration(featuredVideo.duration)}</Pill>
                    </div>

                    <h2 className="text-2xl font-bold text-white">{featuredVideo.title}</h2>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/65">
                      {featuredVideo.description || 'Saved to your library for later watching.'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/55">
                      <span>{formatViews(featuredVideo.views)} views</span>
                      <span>★ {featuredVideo.rating ?? '—'}</span>
                      <span>{featuredVideo.channel ?? 'FLUX Studio'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl py-14 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <FiBookmark className="h-8 w-8 text-sky-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                Your library is empty
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/60">
                Save videos from the home page and they will appear here in a premium streaming-style
                layout.
              </p>

              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90"
              >
                Browse Videos
                <FiArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>

      {videos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <FiSearch className="shrink-0 text-white/40" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search saved titles, genres, creators..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                  {[
                    { id: 'all' as const, label: 'All', icon: <FiGrid /> },
                    { id: 'movie' as const, label: 'Films', icon: <FiFilm /> },
                    { id: 'tv_show' as const, label: 'TV Shows', icon: <FiTv /> },
                  ].map((item) => {
                    const active = activeType === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveType(item.id);
                          setActiveGenre('All');
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          active
                            ? 'bg-white text-[#060814]'
                            : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <span className={active ? 'text-black/55' : 'text-white/35'}>
                          {mediaCounts[item.id]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex max-w-full gap-2 overflow-x-auto">
                  {genres.map((genre) => {
                    const active = genre === activeGenre;

                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => setActiveGenre(genre)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                           ? 'border-blue-400/60 bg-blue-500/20 text-white'
                           : 'border-white/10 bg-white/[0.05] text-white/65 hover:bg-white/[0.10] hover:text-white'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortKey)}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none"
                >
                  <option value="recent" className="bg-neutral-900">
                    Recently added
                  </option>
                  <option value="title" className="bg-neutral-900">
                    Title A–Z
                  </option>
                  <option value="views" className="bg-neutral-900">
                    Most viewed
                  </option>
                  <option value="rating" className="bg-neutral-900">
                    Top rated
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {videos.length > 0 && filteredVideos.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-16 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <FiSearch className="h-6 w-6 text-white/60" />
            </div>

            <h2 className="text-2xl font-bold text-white">No matches found</h2>
            <p className="mt-3 text-white/55">Try a different title, creator, or genre filter.</p>
          </div>
        </section>
      )}

      {filteredVideos.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-12 px-4 py-8 pb-20 sm:px-6 lg:px-8">
          {(activeType === 'all' || activeType === 'movie') && (
            <SectionRow
              title="Films"
              subtitle="Saved standalone movies"
              videos={filteredFilms}
              onVideoClick={(videoId) => router.push(`/video/${videoId}`)}
            />
          )}

          {(activeType === 'all' || activeType === 'tv_show') && (
            <SectionRow
              title="TV Shows"
              subtitle="Saved show episodes and series entries"
              videos={filteredTvShows}
              onVideoClick={(videoId) => router.push(`/video/${videoId}`)}
            />
          )}

          <SectionRow
            title="Continue Watching"
            subtitle="Pick up where you left off"
            videos={continueWatching.length > 0 ? continueWatching : filteredVideos.slice(0, 10)}
            showProgress
            onVideoClick={(videoId) => router.push(`/video/${videoId}`)}
          />

          <SectionRow
            title="Top Picks in Your Library"
            subtitle="Highest-rated titles you saved"
            videos={topRated}
            onVideoClick={(videoId) => router.push(`/video/${videoId}`)}
          />

          <SectionRow
            title="Trending in Your Collection"
            subtitle="Most-viewed saved titles"
            videos={trending}
            onVideoClick={(videoId) => router.push(`/video/${videoId}`)}
          />

          <SectionRow
            title="Watch Again"
            subtitle="Your saved favorites in one place"
            videos={watchAgain}
            onVideoClick={(videoId) => router.push(`/video/${videoId}`)}
          />

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white md:text-2xl">All Saved Titles</h2>
              <p className="mt-1 text-sm text-white/50">
                Full grid view for everything currently in your library
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVideos.map((video) => (
                <VideoCard
  key={`grid-${video.id}`}
  video={video}
  showProgress
  enableHoverDetails
  onClick={() => router.push(`/video/${video.id}`)}
/>
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
