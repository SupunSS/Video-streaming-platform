'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiInfo, FiPlay, FiStar, FiPlus, FiThumbsUp, FiCheck } from 'react-icons/fi';
import { Video } from '@/types/video.types';
import { isVideoInLibrary, toggleLibraryVideo } from '@/lib/library';

interface VideoCardProps {
  video: Video;
  showProgress?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  enableHoverDetails?: boolean;
}

const VideoCardComponent: React.FC<VideoCardProps> = ({
  video,
  showProgress = false,
  isActive = false,
  onClick,
  enableHoverDetails = false,
}) => {
  const router = useRouter();
  const [saved, setSaved] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isVideoInLibrary(video.id);
  });

  useEffect(() => {
    const syncSavedState = () => {
      setSaved(isVideoInLibrary(video.id));
    };

    window.addEventListener('library-updated', syncSavedState);
    return () => {
      window.removeEventListener('library-updated', syncSavedState);
    };
  }, [video.id]);

  const isNewVideo = (createdAt?: string | Date) => {
    if (!createdAt) return false;

    const uploadedTime = new Date(createdAt).getTime();
    const now = new Date().getTime();

    if (Number.isNaN(uploadedTime)) return false;

    const diffInDays = (now - uploadedTime) / (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  };

  const showNewBadge = isNewVideo(video.createdAt);
  const showHoverDetails = isActive || enableHoverDetails;

  const handleLibraryToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    toggleLibraryVideo(video);
    setSaved(isVideoInLibrary(video.id));
  };

  const handleInfoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/video/${video.id}/info`);
  };

  const content = (
    <div
      onClick={!isActive ? onClick : undefined}
      className={`relative w-full aspect-2/3 overflow-hidden rounded-2xl cursor-pointer transition-transform duration-300 ease-out ${
        isActive ? 'group/card hover:scale-105 hover:z-50' : 'group/card'
      }`}
    >
      <Image
        src={video.thumbnail}
        alt={video.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        unoptimized
        className={`absolute inset-0 object-cover transition-transform duration-500 ${
          showHoverDetails ? 'group-hover/card:scale-110' : ''
        }`}
      />

      <div className="absolute inset-0 z-10 bg-linear-to-t from-black/95 via-black/10 to-transparent" />

      <div
        className={`absolute inset-0 z-10 transition-colors duration-300 ${
          showHoverDetails
            ? 'bg-black/0 group-hover/card:bg-black/35'
            : 'bg-black/10 group-hover/card:bg-black/20'
        }`}
      />

      {isActive && (
        <div className="absolute inset-0 z-20 rounded-2xl ring-2 ring-neon-cyan/70 pointer-events-none" />
      )}

      {showNewBadge && (
        <div className="absolute top-14 left-3 z-30">
          <span className="px-2 py-0.5 bg-neon-cyan text-dark-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
            NEW
          </span>
        </div>
      )}

      <button
        onClick={handleInfoClick}
        className="absolute top-3 left-3 z-40 p-2 rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-md transition-colors duration-200 hover:bg-black/80"
        title="More info"
        aria-label={`More info about ${video.title}`}
      >
        <FiInfo className="w-4 h-4" />
      </button>

      {video.rating && (
        <div className="absolute top-3 right-14 z-30">
          <span className="flex items-center gap-1 text-white text-[11px] font-semibold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {video.rating}
          </span>
        </div>
      )}

      <button
        onClick={handleLibraryToggle}
        className={`absolute top-3 right-3 z-40 p-2 rounded-full border backdrop-blur-md transition-colors duration-200 ${
          saved
            ? 'bg-neon-cyan border-neon-cyan'
            : 'bg-black/65 border-white/20 hover:bg-black/80'
        }`}
        title={saved ? 'Remove from Library' : 'Add to Library'}
      >
        {saved ? (
          <FiCheck className="w-4 h-4 text-dark-500" />
        ) : (
          <FiPlus className="w-4 h-4 text-white" />
        )}
      </button>

      {showHoverDetails && (
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center backdrop-blur-sm scale-75 group-hover/card:scale-100 transition-transform duration-300">
            <FiPlay className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 z-30">
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-md">
          {video.title}
        </h3>

        {showHoverDetails ? (
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

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={(e) => e.preventDefault()}
                className="p-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/30 transition-colors duration-200"
              >
                <FiThumbsUp className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        ) : (
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
        )}

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

export const VideoCard = React.memo(VideoCardComponent);
