'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiFilm, FiInfo, FiPlay, FiPlayCircle, FiTv } from 'react-icons/fi';

import { Navbar } from '@/components/layout/Navbar';
import { API_CONFIG } from '@/config/api.config';
import { useVideos } from '@/features/video/useVideos';
import { VideoResponse } from '@/services/video.service';

type CatalogType = 'movie' | 'tv_show';

type CatalogItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  poster: string;
  href: string;
  infoHref: string;
  badge: string;
  year?: number;
};

const buildUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
};

const normalizeSeriesTitle = (title?: string) => title?.trim().toLowerCase() ?? '';

const getEpisodeSortValue = (video: VideoResponse) =>
  (video.seasonNumber ?? 0) * 1000 + (video.episodeNumber ?? 0);

function buildMovieItem(video: VideoResponse): CatalogItem {
  return {
    id: video._id,
    title: video.title,
    subtitle: video.ownerId?.username ?? 'FLUX Studio',
    description: video.description || 'No description available.',
    poster: buildUrl(video.posterUrl || video.thumbnailUrl),
    href: `/video/${video._id}`,
    infoHref: `/video/${video._id}/info`,
    badge: 'Film',
    year: video.releaseYear,
  };
}

function buildTvItems(videos: VideoResponse[]): CatalogItem[] {
  const seriesMap = new Map<string, VideoResponse[]>();

  videos
    .filter((video) => video.type === 'tv_show' && video.seriesTitle?.trim())
    .forEach((video) => {
      const ownerKey = video.ownerId?._id ?? 'unknown';
      const seriesKey = `${ownerKey}:${normalizeSeriesTitle(video.seriesTitle)}`;
      seriesMap.set(seriesKey, [...(seriesMap.get(seriesKey) ?? []), video]);
    });

  return Array.from(seriesMap.values()).map((episodes) => {
    const sortedEpisodes = [...episodes].sort((a, b) => {
      const episodeOrder = getEpisodeSortValue(a) - getEpisodeSortValue(b);
      if (episodeOrder !== 0) return episodeOrder;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    const firstEpisode = sortedEpisodes[0];
    const latestEpisode = sortedEpisodes[sortedEpisodes.length - 1];

    return {
      id: `${firstEpisode.ownerId?._id ?? 'unknown'}-${normalizeSeriesTitle(firstEpisode.seriesTitle)}`,
      title: firstEpisode.seriesTitle || firstEpisode.title,
      subtitle: `${sortedEpisodes.length} episode${sortedEpisodes.length === 1 ? '' : 's'}`,
      description: firstEpisode.description || 'No description available.',
      poster: buildUrl(firstEpisode.posterUrl || firstEpisode.thumbnailUrl),
      href: `/video/${latestEpisode._id}`,
      infoHref: `/video/${latestEpisode._id}/info`,
      badge: 'TV Show',
      year: firstEpisode.releaseYear,
    };
  });
}

export function VideoCatalogPage({
  type,
  title,
  subtitle,
}: {
  type: CatalogType;
  title: string;
  subtitle: string;
}) {
  const { videos, loading } = useVideos();

  const items = useMemo(() => {
    if (type === 'movie') {
      return videos
        .filter((video) => video.type !== 'tv_show')
        .map(buildMovieItem);
    }

    return buildTvItems(videos);
  }, [type, videos]);

  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white/70">
              {type === 'movie' ? <FiFilm /> : <FiTv />}
              {type === 'movie' ? 'Films' : 'TV Shows'}
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              {subtitle}
            </p>
          </div>

          <div className="text-sm text-white/45">
            {items.length} {items.length === 1 ? 'title' : 'titles'}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={index}
                className="aspect-2/3 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
            <FiPlayCircle className="mx-auto mb-4 h-10 w-10 text-white/25" />
            <h2 className="text-xl font-semibold">No titles yet</h2>
            <p className="mt-2 text-sm text-white/45">
              Uploaded {type === 'movie' ? 'films' : 'TV shows'} will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-amber-500/30 hover:bg-white/[0.06]"
              >
                <div className="relative aspect-2/3 overflow-hidden bg-black/30">
                  {item.poster ? (
                    <Image
                      src={item.poster}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/35">
                      No poster
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                    {item.badge}
                  </div>
                  <Link
                    href={item.infoHref}
                    className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/65 p-2 text-white transition hover:bg-black/80"
                    aria-label={`More info about ${item.title}`}
                  >
                    <FiInfo className="h-4 w-4" />
                  </Link>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="line-clamp-2 text-sm font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-1 line-clamp-1 text-xs text-white/55">
                      {item.year ? `${item.year} | ` : ''}
                      {item.subtitle}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
                      >
                        <FiPlay />
                        Watch
                      </Link>
                      <Link
                        href={item.infoHref}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.14] hover:text-white"
                      >
                        <FiInfo />
                        Info
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
