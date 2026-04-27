'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { VideoRowCarousel } from '@/components/home/VideoRowCarousel';
import {
  FiTrendingUp,
  FiClock,
  FiThumbsUp,
  FiZap,
  FiPlayCircle,
} from 'react-icons/fi';
import { Video } from '@/types/video.types';
import { useVideos } from '@/features/video/useVideos';
import { API_CONFIG } from '@/config/api.config';

const BASE_URL = API_CONFIG.BASE_URL;

type RawVideo = {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  posterUrl?: string;
  duration?: number;
  views?: number;
  ratingsCount?: number;
  averageRating?: number;
  createdAt: string;
  videoUrl: string;
  user?: {
    username?: string;
  };
};

const buildUrl = (url: string) =>
  url.startsWith('http') ? url : `${BASE_URL}${url}`;

const mapToVideo = (video: RawVideo, index: number): Video => ({
  id: video._id,
  title: video.title,
  description: video.description || '',
  thumbnail: buildUrl(video.posterUrl || video.thumbnailUrl),
  duration: video.duration || 0,
  views: video.views || 0,
  channel: video.user?.username || 'FLUX Creator',
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
  year: 2024 - (index % 4),
  genre: ['Action', 'Thriller', 'Drama', 'Sci-Fi', 'Fantasy', 'Crime'][index % 6],
  progress: ((index + 2) * 11) % 85,
});

export default function HomePage() {
  const { videos: rawVideos, loading } = useVideos();

  const videos = useMemo(
    () => (rawVideos as RawVideo[]).map((video, index) => mapToVideo(video, index)),
    [rawVideos],
  );

  const featuredVideo    = videos[0] ?? null;
  const trending         = videos.slice(0, 10);
  const newReleases      = videos.slice(0, 8);
  const continueWatching = videos.slice(0, 10);
  const recommended      = [...videos].reverse().slice(0, 10);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cyber-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-white" />
          <p className="text-sm text-white/45">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-cyber-gradient text-white">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
            <FiPlayCircle className="text-sky-300" />
            No content yet
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Your streaming homepage is ready
          </h1>

          <p className="max-w-xl text-base leading-7 text-white/55">
            Upload your first title to start building a cinematic front page experience.
          </p>

          <Link
            href="/upload"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90"
          >Upload the first video</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_22%),linear-gradient(to_bottom,rgba(6,8,20,0.08),rgba(6,8,20,0.84)_52%,rgba(6,8,20,1))]" />

        {featuredVideo && (
          <div className="relative">
            <HeroSection video={featuredVideo} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#060814] via-[#060814]/85 to-transparent" />
          </div>
        )}

        <section className="relative z-10 -mt-28 pb-24">
          <div className="space-y-14 md:space-y-16 lg:space-y-18">
            <div className="px-1">
              <VideoRowCarousel
                title="Trending Now"
                icon={<FiTrendingUp className="h-4 w-4 text-sky-300" />}
                videos={trending}
              />
            </div>

            <div className="px-1">
              <VideoRowCarousel
                title="New Releases"
                icon={<FiZap className="h-4 w-4 text-blue-300" />}
                videos={newReleases}
              />
            </div>

            <div className="px-1">
              <VideoRowCarousel
                title="Continue Watching"
                icon={<FiClock className="h-4 w-4 text-cyan-300" />}
                videos={continueWatching}
                showProgress
              />
            </div>

            <div className="px-1">
              <VideoRowCarousel
                title="Recommended For You"
                icon={<FiThumbsUp className="h-4 w-4 text-indigo-300" />}
                videos={recommended}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
