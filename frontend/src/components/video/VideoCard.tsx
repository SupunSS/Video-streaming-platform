// src/components/video/VideoCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { FiPlay, FiStar, FiPlus, FiThumbsUp } from 'react-icons/fi';
import { Video } from '@/types/video.types';

interface VideoCardProps {
  video: Video;
  showProgress?: boolean;
  isActive?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  showProgress = false,
  isActive = false,
}) => {
  const content = (
    // aspect-[2/3] = tall poster shape like Netflix/movie poster
    <div className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl group/card cursor-pointer transition-transform duration-300 ease-out hover:scale-105 hover:z-50">
      {/* Thumbnail */}
      <img
        src={video.thumbnail}
        alt={video.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
      />

      {/* Base gradient — stronger at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />

      {/* Hover darkening overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/35 transition-colors duration-300" />

      {/* Active cyan glow border */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-neon-cyan/70 pointer-events-none" />
      )}

      {/* Top-left badge */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        {video.isNew ? (
          <span className="px-2 py-0.5 bg-neon-cyan text-dark-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
            New
          </span>
        ) : (
          <span />
        )}
        {video.rating && (
          <span className="flex items-center gap-1 text-white text-[11px] font-semibold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {video.rating}
          </span>
        )}
      </div>

      {/* Center play button — fades in on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
        <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center backdrop-blur-sm scale-75 group-hover/card:scale-100 transition-transform duration-300">
          <FiPlay className="w-6 h-6 text-white fill-white ml-1" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 group-hover/card:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-md">
          {video.title}
        </h3>

        {/* Extra meta — revealed on hover */}
        <div className="overflow-hidden max-h-0 group-hover/card:max-h-24 transition-all duration-300 ease-out">
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-white/65 text-[11px]">
            {video.year && <span>{video.year}</span>}
            {video.genre && (
              <>
                <span className="text-white/30">·</span>
                <span>{video.genre}</span>
              </>
            )}
            {video.duration && (
              <>
                <span className="text-white/30">·</span>
                <span>{video.duration}</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/30 transition-colors duration-200"
            >
              <FiPlus className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/30 transition-colors duration-200"
            >
              <FiThumbsUp className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && video.progress != null && (
          <div className="mt-2 h-0.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-cyan rounded-full transition-all duration-300"
              style={{ width: `${video.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    // overflow-visible so hover:scale-105 isn't clipped
    <div className="w-full bg-dark-400 rounded-2xl overflow-visible">
      {isActive ? (
        <Link href={`/video/${video.id}`} className="block w-full h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};