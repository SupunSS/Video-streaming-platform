// src/components/home/VideoRowCarousel.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VideoCard } from '@/components/video/VideoCard';
import { Video } from '@/types/video.types';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface VideoRowCarouselProps {
  title: string;
  videos: Video[];
  showProgress?: boolean;
}

// Wider cards + more generous spacing between them
const X_OFFSETS = [0,   230,  370,  490,  600];
const SCALES    = [1,   0.85, 0.73, 0.63, 0.55];
const OPACITIES = [1,   1,    0.85, 0.5,  0];
const Z_INDEXES = [30,  20,   12,   6,    1];

export const VideoRowCarousel: React.FC<VideoRowCarouselProps> = ({
  title,
  videos,
  showProgress = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(Math.floor(videos.length / 2));

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % videos.length);
  };

  const getCardMotionProps = (index: number) => {
    let diff = index - activeIndex;
    const half = Math.floor(videos.length / 2);
    if (diff > half) diff -= videos.length;
    if (diff < -half) diff += videos.length;

    const absDiff = Math.abs(diff);
    const sign = diff < 0 ? -1 : 1;
    const idx = Math.min(absDiff, 4);

    return {
      x: sign * X_OFFSETS[idx],
      scale: SCALES[idx],
      opacity: OPACITIES[idx],
      zIndex: Z_INDEXES[idx],
    };
  };

  return (
    <div className="relative group/row py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
          <button
            onClick={handlePrevious}
            className="p-2 bg-dark-400 border border-white/10 rounded-full hover:border-neon-cyan/50 transition-all duration-300"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 bg-dark-400 border border-white/10 rounded-full hover:border-neon-cyan/50 transition-all duration-300"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel — taller to fit the poster aspect ratio */}
      <div className="relative h-[460px] overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-dark-500 to-transparent z-40 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-dark-500 to-transparent z-40 pointer-events-none" />

        <div className="relative w-full h-full flex items-center justify-center">
          {videos.map((video, index) => {
            const isActive = index === activeIndex;
            const { x, scale, opacity, zIndex } = getCardMotionProps(index);

            return (
              <motion.div
                key={video.id}
                // w-52 = 208px wide, with aspect-[2/3] gives ~312px tall — fits in 460px container
                className="absolute w-52"
                animate={{ x, scale, opacity, zIndex }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 30,
                  mass: 0.7,
                  opacity: { duration: 0.2, ease: 'easeOut' },
                }}
                style={{ transformOrigin: 'center center' }}
                onClick={() => !isActive && setActiveIndex(index)}
              >
                <VideoCard
                  video={video}
                  showProgress={showProgress}
                  isActive={isActive}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
