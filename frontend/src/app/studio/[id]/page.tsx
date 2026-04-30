'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiFilm, FiInfo, FiPlay, FiStar, FiTv, FiUser } from 'react-icons/fi';

import { Navbar } from '@/components/layout/Navbar';
import { API_CONFIG } from '@/config/api.config';
import { videoService, VideoResponse } from '@/services/video.service';

const buildUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
};

const normalizeSeriesTitle = (title?: string) => title?.trim().toLowerCase() ?? '';

const getEpisodeSortValue = (video: VideoResponse) =>
  (video.seasonNumber ?? 0) * 1000 + (video.episodeNumber ?? 0);

type ProductCardData = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  poster: string;
  watchHref: string;
  infoHref: string;
  badge: string;
  rating?: string;
};

function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-amber-500/30 hover:bg-white/[0.06]">
      <div className="relative aspect-2/3 overflow-hidden bg-black/30">
        {product.poster ? (
          <Image
            src={product.poster}
            alt={product.title}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/35">
            No poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
          {product.badge}
        </div>
        {product.rating && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
            <FiStar className="text-amber-300" />
            {product.rating}
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">
            {product.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-white/55">
            {product.subtitle}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={product.watchHref}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
            >
              <FiPlay />
              Watch
            </Link>
            <Link
              href={product.infoHref}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.14] hover:text-white"
            >
              <FiInfo />
              Info
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function buildFilmProduct(video: VideoResponse): ProductCardData {
  return {
    id: video._id,
    title: video.title,
    subtitle: video.releaseYear ? `${video.releaseYear} Film` : 'Film',
    description: video.description || '',
    poster: buildUrl(video.posterUrl || video.thumbnailUrl),
    watchHref: `/video/${video._id}`,
    infoHref: `/video/${video._id}/info`,
    badge: 'Film',
    rating: video.ratingsCount > 0 ? video.averageRating.toFixed(1) : undefined,
  };
}

function buildTvProducts(videos: VideoResponse[]): ProductCardData[] {
  const seriesMap = new Map<string, VideoResponse[]>();

  videos
    .filter((video) => video.type === 'tv_show' && video.seriesTitle?.trim())
    .forEach((video) => {
      const key = normalizeSeriesTitle(video.seriesTitle);
      seriesMap.set(key, [...(seriesMap.get(key) ?? []), video]);
    });

  return Array.from(seriesMap.values()).map((episodes) => {
    const sortedEpisodes = [...episodes].sort((a, b) => {
      const order = getEpisodeSortValue(a) - getEpisodeSortValue(b);
      if (order !== 0) return order;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    const firstEpisode = sortedEpisodes[0];
    const latestEpisode = sortedEpisodes[sortedEpisodes.length - 1];

    return {
      id: normalizeSeriesTitle(firstEpisode.seriesTitle),
      title: firstEpisode.seriesTitle || firstEpisode.title,
      subtitle: `${sortedEpisodes.length} episode${sortedEpisodes.length === 1 ? '' : 's'}`,
      description: firstEpisode.description || '',
      poster: buildUrl(firstEpisode.posterUrl || firstEpisode.thumbnailUrl),
      watchHref: `/video/${latestEpisode._id}`,
      infoHref: `/video/${latestEpisode._id}/info`,
      badge: 'TV Show',
      rating:
        latestEpisode.ratingsCount > 0
          ? latestEpisode.averageRating.toFixed(1)
          : undefined,
    };
  });
}

function ProductSection({
  title,
  icon,
  products,
}: {
  title: string;
  icon: React.ReactNode;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-amber-300">{icon}</span>
        <h2 className="text-2xl font-bold">{title}</h2>
        <span className="text-sm text-white/40">({products.length})</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={`${title}-${product.id}`} product={product} />
        ))}
      </div>
    </section>
  );
}

export default function StudioPage() {
  const params = useParams();
  const studioId = params?.id as string;

  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studioId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await videoService.getAll();
        setVideos(data.filter((video) => video.ownerId?._id === studioId));
      } catch (loadError) {
        console.error('Failed to load studio:', loadError);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [studioId]);

  const studio = videos[0]?.ownerId;
  const films = useMemo(
    () => videos.filter((video) => video.type !== 'tv_show').map(buildFilmProduct),
    [videos],
  );
  const tvShows = useMemo(
    () => buildTvProducts(videos.filter((video) => video.type === 'tv_show')),
    [videos],
  );
  const heroImage = buildUrl(videos[0]?.thumbnailUrl || videos[0]?.posterUrl);

  return (
    <main className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <section className="relative overflow-hidden pt-24">
        {heroImage && (
          <Image
            src={heroImage}
            alt={studio?.username ?? 'Studio'}
            fill
            sizes="100vw"
            priority
            unoptimized
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#060814]/70 via-[#060814]/92 to-[#060814]" />

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
          {loading ? (
            <div className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.05]" />
          ) : error || videos.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-10 text-center">
              <FiUser className="mx-auto mb-4 h-10 w-10 text-white/35" />
              <h1 className="text-2xl font-bold">Studio not found</h1>
              <p className="mt-2 text-sm text-white/55">
                This studio does not have public titles yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/70">
                  <FiUser className="text-sky-300" />
                  Studio
                </div>
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  {studio?.username ?? 'Unknown Studio'}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                  Browse every public title from this studio, grouped into films and TV shows.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                  <p className="text-2xl font-bold">{videos.length}</p>
                  <p className="text-xs text-white/45">Videos</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                  <p className="text-2xl font-bold">{films.length}</p>
                  <p className="text-xs text-white/45">Films</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                  <p className="text-2xl font-bold">{tvShows.length}</p>
                  <p className="text-xs text-white/45">TV Shows</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {!loading && !error && videos.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
          <ProductSection title="Films" icon={<FiFilm />} products={films} />
          <ProductSection title="TV Shows" icon={<FiTv />} products={tvShows} />
        </section>
      )}
    </main>
  );
}
