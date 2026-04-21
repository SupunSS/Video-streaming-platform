'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { VideoCard } from '@/components/video/VideoCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Video } from '@/types/video.types';

interface VideoRowProps {
  title: string;
  icon?: React.ReactNode;
  videos: Video[];
  showProgress?: boolean;
}

export const VideoRow: React.FC<VideoRowProps> = ({ title, icon, videos, showProgress = false }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/row">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="section-title text-2xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
          <button onClick={() => scroll('left')} className="p-2 bg-glass-light backdrop-blur-xl border border-white/10 rounded-full hover:border-neon-cyan/50 hover:shadow-neon-cyan transition-all duration-300">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 bg-glass-light backdrop-blur-xl border border-white/10 rounded-full hover:border-neon-cyan/50 hover:shadow-neon-cyan transition-all duration-300">
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={rowRef} className="flex gap-4 overflow-x-auto scrollbar-thin pb-4 snap-x snap-mandatory">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            className="flex-shrink-0 w-72 snap-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <VideoCard video={video} showProgress={showProgress} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};