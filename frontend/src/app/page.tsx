'use client';

import React, { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { VideoRowCarousel } from '@/components/home/VideoRowCarousel';
import { FiTrendingUp, FiClock, FiThumbsUp, FiZap } from 'react-icons/fi';
import { Video } from '@/types/video.types';
import { useVideos } from '@/features/video/useVideos';
import { API_CONFIG } from '@/config/api.config';

const BASE_URL = API_CONFIG.BASE_URL;

const mapToVideo = (v: any): Video => ({
  id: v._id,
  title: v.title,
  description: v.description || '',
  thumbnail: v.thumbnailUrl.startsWith('http')
    ? v.thumbnailUrl
    : `${BASE_URL}${v.thumbnailUrl}`,
  duration: v.duration || 0,
  views: v.views || 0,
  channel: 'FLUX Creator',
  uploadedAt: new Date(v.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }),
  hlsUrl: v.videoUrl.startsWith('http')
    ? v.videoUrl
    : `${BASE_URL}${v.videoUrl}`,
  status: 'ready',
});

export default function HomePage() {
  const { videos: rawVideos, loading } = useVideos();

  const videos = useMemo(() => rawVideos.map(mapToVideo), [rawVideos]);

  const featuredVideo  = videos[0] ?? null;
  const trending       = videos.slice(0, 10);
  const newReleases    = videos.slice(0, 8);
  const recommended    = videos.slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-[#080a0f]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-white/40 text-lg">No videos yet</p>
          <a href="/upload" className="px-6 py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors">Upload the first video</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f]">
      <Navbar />
      <main>
        {featuredVideo && <HeroSection video={featuredVideo} />}

        <div className="relative z-10 -mt-20 pb-16 space-y-10">
          <VideoRowCarousel
            title="Trending Now"
            icon={<FiTrendingUp className="w-4 h-4 text-amber-400" />}
            badge={{ label: 'Live Rankings', pulse: true }}
            videos={trending}
            cardStyle="poster"
          />

          <VideoRowCarousel
            title="New Releases"
            icon={<FiZap className="w-4 h-4 text-amber-400" />}
            badge={{ label: 'Just Added' }}
            videos={newReleases}
            cardStyle="poster"
            highlightNew
          />

          <VideoRowCarousel
            title="Continue Watching"
            icon={<FiClock className="w-4 h-4 text-sky-400" />}
            videos={videos}
            cardStyle="poster"
            showProgress
          />

          <VideoRowCarousel
            title="Recommended For You"
            icon={<FiThumbsUp className="w-4 h-4 text-violet-400" />}
            videos={recommended}
            cardStyle="poster"
          />
        </div>
      </main>
    </div>
  );
}