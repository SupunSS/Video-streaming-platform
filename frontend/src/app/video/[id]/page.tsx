/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { CommentSection } from '@/components/video/CommentSection';
import {
  FiPlay, FiCheckCircle, FiShare2, FiDownload,
  FiThumbsUp, FiPlus, FiChevronDown, FiChevronUp, FiList,
} from 'react-icons/fi';
import { videoService, VideoResponse } from '@/services/video.service';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const buildUrl = (url: string) =>
  url.startsWith('http') ? url : `${BASE_URL}${url}`;

export default function WatchPage() {
  const params  = useParams();
  const videoId = params?.id as string;

  const [video, setVideo]                         = useState<VideoResponse | null>(null);
  const [allVideos, setAllVideos]                 = useState<VideoResponse[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState(false);
  const [isSubscribed, setIsSubscribed]           = useState(false);
  const [isLiked, setIsLiked]                     = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // 👇 fetch video directly inside the component using useEffect
  // this avoids any hook resolution issues
  useEffect(() => {
    if (!videoId) return;

    const load = async () => {
      try {
        setLoading(true);
        const [videoData, allData] = await Promise.all([
          videoService.getOne(videoId),
          videoService.getAll(),
        ]);
        setVideo(videoData);
        setAllVideos(allData);
        videoService.incrementViews(videoId).catch(() => {});
      } catch (err) {
        console.error('Failed to load video:', err);
        setError(true);
        toast.error('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [videoId]);

  const recommendedVideos = allVideos.filter(v => v._id !== videoId).slice(0, 10);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <p className="text-white/60 text-lg mb-4">Video not found</p>
            <Link href="/" className="text-amber-400 hover:text-amber-300 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nextVideo = recommendedVideos[0];

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <Navbar />

      <main className="pt-14">

        {/* ── VIDEO PLAYER ── */}
        <div className="w-full bg-black">
          <div className="max-w-screen-2xl mx-auto">
            <div className="w-full aspect-video">
              <VideoPlayer
                src={buildUrl(video.videoUrl)}
                poster={buildUrl(video.thumbnailUrl)}
                title={video.title}
              />
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* LEFT */}
            <div className="flex-1 min-w-0">

              <h1
                className="text-3xl lg:text-5xl font-black uppercase tracking-widest leading-none text-white mb-3"
                style={{ fontFamily: "'Bebas Neue', 'Anton', sans-serif" }}
              >
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-white/40 uppercase tracking-wide mb-5">
                <span className="px-2 py-1 rounded border border-white/10">
                  {new Date(video.createdAt).getFullYear()}
                </span>
                <span className="px-2 py-1 rounded border border-white/10">
                  {formatDuration(video.duration)}
                </span>
                <span className="text-white/20">·</span>
                <span>{formatViews(video.views)} views</span>
                <span className="text-white/20">·</span>
                <span>{formatDate(video.createdAt)}</span>
              </div>

              <div className="flex items-center gap-4 border-t border-b border-white/[0.06] py-4 mb-5">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0 bg-white/10 flex items-center justify-center font-bold text-white">
                  {video.title[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-white">FLUX Creator</span>
                    <FiCheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-xs text-white/40">Uploaded {formatDate(video.createdAt)}</p>
                </div>
                <button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`ml-auto shrink-0 px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-all ${
                    isSubscribed
                      ? 'border border-white/15 text-white/60 hover:bg-white/5'
                      : 'bg-amber-500 text-black hover:bg-amber-400'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium border transition-all ${
                    isLiked
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FiThumbsUp className="w-4 h-4" />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
                  <FiPlus className="w-4 h-4" /><span>Watchlist</span>
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
                  <FiShare2 className="w-4 h-4" /><span>Share</span>
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
                  <FiDownload className="w-4 h-4" /><span>Save</span>
                </button>
              </div>

              {video.description && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-5 py-4 mb-8">
                  <p className={`text-sm text-white/55 leading-relaxed whitespace-pre-line ${!showFullDescription && 'line-clamp-3'}`}>
                    {video.description}
                  </p>
                  {video.description.length > 120 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="flex items-center gap-1 mt-3 text-amber-400/80 hover:text-amber-400 text-xs font-medium transition-colors"
                    >
                      {showFullDescription
                        ? <><FiChevronUp className="w-3.5 h-3.5" />Show less</>
                        : <><FiChevronDown className="w-3.5 h-3.5" />Show more</>
                      }
                    </button>
                  )}
                </div>
              )}

              <CommentSection videoId={videoId} />
            </div>

            {/* RIGHT */}
            <div className="lg:w-[340px] shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <FiList className="w-4 h-4 text-amber-400" />
                <h2
                  className="text-white font-bold uppercase tracking-[0.15em]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px' }}
                >
                  Up Next
                </h2>
                <span className="ml-auto text-xs text-white/30">{recommendedVideos.length} videos</span>
              </div>

              {recommendedVideos.length === 0 && (
                <p className="text-white/30 text-sm text-center py-8">No other videos yet</p>
              )}

              {nextVideo && (
                <Link
                  href={`/video/${nextVideo._id}`}
                  className="block group relative overflow-hidden rounded-lg mb-4 border border-white/[0.06] hover:border-amber-500/30 transition-colors"
                >
                  <div className="relative w-full aspect-video overflow-hidden">
                    <img
                      src={buildUrl(nextVideo.thumbnailUrl)}
                      alt={nextVideo.title}
                      className="w-full h-full object-cover brightness-50 group-hover:brightness-60 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 rounded-full border-2 border-amber-400/70 flex items-center justify-center bg-black/40 group-hover:bg-amber-400/20 transition-all">
                        <FiPlay className="w-5 h-5 text-amber-400 ml-1" />
                      </div>
                      <span className="text-xs text-white/60 uppercase tracking-widest">Play next</span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {formatDuration(nextVideo.duration)}
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-[#0f1218]">
                    <p className="text-[10px] text-amber-400/70 uppercase tracking-widest mb-1">Next up</p>
                    <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {nextVideo.title}
                    </h3>
                    <p className="text-xs text-white/35 mt-0.5">{formatViews(nextVideo.views)} views</p>
                  </div>
                </Link>
              )}

              <div className="flex flex-col gap-0.5">
                {recommendedVideos.slice(1).map((recVideo, index) => (
                  <motion.div
                    key={recVideo._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Link
                      href={`/video/${recVideo._id}`}
                      className="flex gap-3 p-2 rounded-lg group hover:bg-white/[0.04] transition-all"
                    >
                      <div className="relative w-[112px] h-[63px] rounded overflow-hidden shrink-0">
                        <img
                          src={buildUrl(recVideo.thumbnailUrl)}
                          alt={recVideo.title}
                          className="w-full h-full object-cover brightness-75 group-hover:brightness-90 group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FiPlay className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-px rounded">
                          {formatDuration(recVideo.duration)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="text-xs font-semibold text-white/85 group-hover:text-white line-clamp-2 leading-snug transition-colors">
                          {recVideo.title}
                        </h3>
                        <p className="text-[11px] text-white/25">{formatViews(recVideo.views)} views</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}