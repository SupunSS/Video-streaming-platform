'use client';

import { useEffect, useState } from 'react';
import { VideoCard } from '@/components/video/VideoCard';
import { Video } from '@/types/video.types';
import { getLibraryVideos } from '@/lib/library';
import { Navbar } from '@/components/layout/Navbar';
import { FiBookmark, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const loadLibrary = () => {
      setVideos(getLibraryVideos());
    };

    loadLibrary();

    window.addEventListener('library-updated', loadLibrary);
    window.addEventListener('focus', loadLibrary);

    return () => {
      window.removeEventListener('library-updated', loadLibrary);
      window.removeEventListener('focus', loadLibrary);
    };
  }, []);

  return (
    <main className="min-h-screen bg-dark-500 text-white">
      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="max-w-480 mx-auto px-4 lg:px-6 pt-24 pb-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
              <FiBookmark className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">My Library</h1>
            </div>
          </div>
          <p className="text-white/60 ml-13">
            {videos.length === 0
              ? 'Your saved videos will appear here'
              : `${videos.length} ${videos.length === 1 ? 'video' : 'videos'} saved`}
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="inline-flex p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <FiBookmark className="w-16 h-16 text-white/40" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Your library is empty</h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                Start building your collection by adding videos from the home page. Click the plus button on any video card to save it here.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neon-cyan text-dark-500 font-semibold hover:bg-neon-cyan/90 transition-all duration-200 hover:scale-105"
              >
                <FiArrowLeft className="w-4 h-4" />
                Browse Videos
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 lg:gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} isActive />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}