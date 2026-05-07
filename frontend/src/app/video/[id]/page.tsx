'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiEye,
  FiHeart,
  FiInfo,
  FiList,
  FiPlay,
  FiPlus,
  FiShare2,
  FiStar,
} from 'react-icons/fi';

import { notify } from '@/components/ui/CustomToast';
import { Navbar } from '@/components/layout/Navbar';
import VideoPlayer from '@/components/video/VideoPlayer';
import { API_CONFIG } from '@/config/api.config';
import { getErrorMessage } from '@/lib/api-error';
import { followService } from '@/services/follow.service';
import { videoService, VideoResponse } from '@/services/video.service';
import { useAppSelector } from '@/store/hooks';

const BASE_URL =
  API_CONFIG.BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const buildUrl = (url?: string): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

const formatViews = (views: number): string => {
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
};

const formatDuration = (seconds?: number): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatFullDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatCompactDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const normalizeSeriesTitle = (title?: string) => title?.trim().toLowerCase() ?? '';

const getEpisodeSortValue = (video: VideoResponse) =>
  (video.seasonNumber ?? 0) * 1000 + (video.episodeNumber ?? 0);

const getEpisodeLabel = (video: VideoResponse) => {
  if (video.type !== 'tv_show') return 'Movie';

  const season = video.seasonNumber ? `S${video.seasonNumber}` : 'Special';
  const episode = video.episodeNumber
    ? `E${video.episodeNumber.toString().padStart(2, '0')}`
    : '';

  return [season, episode].filter(Boolean).join(' ');
};

type SeasonGroup = {
  seasonNumber: number;
  episodes: VideoResponse[];
};

function WatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="aspect-video animate-pulse rounded-3xl border border-white/10 bg-white/[0.05]" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-40 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function WatchPageError() {
  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />
      <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-4 pt-24 sm:px-6 lg:px-8">
        <div className="glass-card w-full max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <FiPlay className="text-xl" />
          </div>
          <h1 className="text-2xl font-bold">Video not found</h1>
          <p className="mt-3 text-sm text-white/60">
            The video could not be loaded. It may have been removed or the link is invalid.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetaPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 backdrop-blur-xl">
      <span className="text-white/55">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active = false,
  primary = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const className = primary
    ? 'bg-amber-500 text-black hover:bg-amber-400 border-amber-500'
    : active
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
      : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EpisodeCard({
  video,
  active = false,
}: {
  video: VideoResponse;
  active?: boolean;
}) {
  const thumbnail = buildUrl(video.thumbnailUrl || video.posterUrl);
  const episodeTitle = video.episodeTitle || video.title;

  return (
    <Link
      href={`/video/${video._id}`}
      aria-current={active ? 'page' : undefined}
      className="group block"
    >
      <motion.article
        whileHover={active ? undefined : { x: 3 }}
        className={`flex gap-3 rounded-2xl border p-2.5 transition-all duration-300 ${
          active
            ? 'border-amber-500/35 bg-amber-500/10'
            : 'border-white/10 bg-white/[0.035] hover:border-amber-500/25 hover:bg-white/[0.055]'
        }`}
      >
        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={episodeTitle}
              fill
              sizes="160px"
              unoptimized
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/35">
              No thumbnail
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            {active ? 'Now playing' : getEpisodeLabel(video)}
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold text-white transition group-hover:text-amber-300">
            {episodeTitle}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
            {video.releaseYear && <span>{video.releaseYear}</span>}
            {video.releaseYear && <span>|</span>}
            <span>{formatCompactDate(video.createdAt)}</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function RatingButton({
  value,
  active,
  disabled,
  onClick,
}: {
  value: number;
  active: boolean;
  disabled: boolean;
  onClick: (value: number) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(value)}
      className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
        active
          ? 'border-amber-500 bg-amber-500 text-black'
          : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {value}
    </button>
  );
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params?.id as string;
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [allVideos, setAllVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [followState, setFollowState] = useState<{
    ownerId: string;
    userId: string;
    isFollowing: boolean;
  } | null>(null);
  const [submittingFollow, setSubmittingFollow] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [metadataDuration, setMetadataDuration] = useState<{
    videoId: string;
    duration: number;
  } | null>(null);
  const currentUserId = user?.id || user?.email || '';

  useEffect(() => {
    if (!videoId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);

        const token =
          typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const ratingRequest = token
          ? videoService
              .getMyRating(videoId)
              .catch((): { value: number | null } => ({ value: null }))
          : Promise.resolve({ value: null });

        const [videoData, ratingData] = await Promise.all([
          videoService.getOne(videoId),
          ratingRequest,
        ]);

        const catalog =
          videoData.type === 'tv_show' ? await videoService.getAll() : [];

        setVideo(videoData);
        setAllVideos(catalog);
        setUserRating(videoData.myRating ?? ratingData.value);

        videoService.incrementViews(videoId).catch(() => undefined);
      } catch (loadError) {
        console.warn(
          getErrorMessage(loadError, 'Failed to load watch page. Check that the API server is running.'),
        );
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [videoId]);

  useEffect(() => {
    const ownerId = video?.ownerId?._id;

    if (!ownerId || !isAuthenticated || user?.id === ownerId) return;

    let cancelled = false;

    const loadFollowStatus = async () => {
      try {
        const status = await followService.getStatus(ownerId);
        if (!cancelled) {
          setFollowState({
            ownerId,
            userId: currentUserId,
            isFollowing: status.isFollowing,
          });
        }
      } catch {
        if (!cancelled) {
          setFollowState({
            ownerId,
            userId: currentUserId,
            isFollowing: false,
          });
        }
      }
    };

    void loadFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, isAuthenticated, user?.id, video?.ownerId?._id]);

  useEffect(() => {
    if (!video || video.duration > 0 || !video.videoUrl) return;

    let cancelled = false;
    const media = document.createElement('video');
    media.preload = 'metadata';
    media.onloadedmetadata = () => {
      if (!cancelled && Number.isFinite(media.duration) && media.duration > 0) {
        setMetadataDuration({
          videoId: video._id,
          duration: Math.round(media.duration),
        });
      }
    };
    media.src = buildUrl(video.videoUrl);

    return () => {
      cancelled = true;
      media.removeAttribute('src');
      media.load();
    };
  }, [video]);

  const seriesEpisodes = useMemo(() => {
    if (!video || video.type !== 'tv_show') return [];

    const seriesTitle = normalizeSeriesTitle(video.seriesTitle);
    if (!seriesTitle) return [video];

    return allVideos
      .filter(
        (item) =>
          item.type === 'tv_show' &&
          normalizeSeriesTitle(item.seriesTitle) === seriesTitle &&
          item.ownerId?._id === video.ownerId?._id,
      )
      .sort((a, b) => {
        const episodeOrder = getEpisodeSortValue(a) - getEpisodeSortValue(b);
        if (episodeOrder !== 0) return episodeOrder;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [allVideos, video]);

  const seasonGroups = useMemo<SeasonGroup[]>(() => {
    const groups = new Map<number, VideoResponse[]>();

    seriesEpisodes.forEach((episode) => {
      const season = episode.seasonNumber ?? 1;
      groups.set(season, [...(groups.get(season) ?? []), episode]);
    });

    return Array.from(groups.entries())
      .sort(([seasonA], [seasonB]) => seasonA - seasonB)
      .map(([seasonNumber, episodes]) => ({
        seasonNumber,
        episodes: episodes.sort((a, b) => {
          const episodeA = a.episodeNumber ?? 0;
          const episodeB = b.episodeNumber ?? 0;
          if (episodeA !== episodeB) return episodeA - episodeB;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
      }));
  }, [seriesEpisodes]);

  const otherEpisodesCount = useMemo(
    () => seriesEpisodes.filter((item) => item._id !== videoId).length,
    [seriesEpisodes, videoId],
  );

  const isTvShow = video?.type === 'tv_show';
  const heroPoster = buildUrl(video?.thumbnailUrl || video?.posterUrl);
  const videoSource = buildUrl(video?.videoUrl);
  const runtime =
    video?.duration && video.duration > 0
      ? video.duration
      : metadataDuration && metadataDuration.videoId === video?._id
        ? metadataDuration.duration
        : undefined;
  const description =
    video?.description?.trim() || 'No description available for this title.';
  const shouldCollapseDescription = description.length > 220;
  const titleLabel =
    isTvShow && video?.seriesTitle ? video.seriesTitle : video?.title;
  const episodeLabel =
    isTvShow && video ? video.episodeTitle || video.title : undefined;
  const ratingLabel =
    video && video.ratingsCount > 0
      ? `${video.averageRating.toFixed(1)} / 10`
      : 'No ratings yet';
  const ownerId = video?.ownerId?._id;
  const isFollowed = Boolean(
    ownerId &&
      currentUserId &&
      followState?.ownerId === ownerId &&
      followState.userId === currentUserId &&
      followState.isFollowing,
  );

  const handleRate = async (value: number) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      notify.error('Please sign in to rate this title');
      router.push('/login');
      return;
    }

    if (!videoId) return;

    try {
      setSubmittingRating(true);
      const updatedVideo = await videoService.rate(videoId, value);
      setVideo(updatedVideo);
      setUserRating(updatedVideo.myRating ?? value);
      notify.success(`Your rating is now ${value}/10`);
    } catch (rateError) {
      console.error('Failed to submit rating:', rateError);
      notify.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleFollow = async () => {
    const ownerId = video?.ownerId?._id;

    if (!ownerId) return;

    if (!isAuthenticated) {
      notify.error('Please sign in to follow studios');
      router.push('/login');
      return;
    }

    if (user?.id === ownerId) {
      notify.error('You cannot follow your own studio account');
      return;
    }

    const nextFollowState = !isFollowed;

    try {
      setSubmittingFollow(true);
      setFollowState({
        ownerId,
        userId: currentUserId,
        isFollowing: nextFollowState,
      });

      if (nextFollowState) {
        await followService.follow(ownerId);
        notify.success(`Following ${video.ownerId?.username ?? 'studio'}`);
      } else {
        await followService.unfollow(ownerId);
        notify.success(`Unfollowed ${video.ownerId?.username ?? 'studio'}`);
      }
    } catch (followError) {
      setFollowState({
        ownerId,
        userId: currentUserId,
        isFollowing: !nextFollowState,
      });
      notify.error(getErrorMessage(followError, 'Failed to update follow'));
    } finally {
      setSubmittingFollow(false);
    }
  };

  if (loading) return <WatchPageSkeleton />;
  if (error || !video) return <WatchPageError />;

  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%)]" />

        <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          <div
            className={
              isTvShow
                ? 'grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]'
                : 'mx-auto max-w-6xl'
            }
          >
            <section className="min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
              >
                <VideoPlayer src={videoSource} poster={heroPoster} title={video.title} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="mt-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <MetaPill icon={<FiPlay />}>
                    {isTvShow ? 'Series Episode' : 'Movie'}
                  </MetaPill>
                  <MetaPill icon={<FiStar />}>{ratingLabel}</MetaPill>
                  <MetaPill icon={<FiList />}>
                    {video.ratingsCount > 0
                      ? `${video.ratingsCount} ratings`
                      : 'Be the first to rate'}
                  </MetaPill>
                  <MetaPill icon={<FiClock />}>
                    {formatDuration(runtime)}
                  </MetaPill>
                  <MetaPill icon={<FiEye />}>
                    {formatViews(video.views)} views
                  </MetaPill>
                  {isTvShow && <MetaPill icon={<FiList />}>{getEpisodeLabel(video)}</MetaPill>}
                </div>

                <div className="mt-4">
                  {isTvShow && episodeLabel && (
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-amber-300/90">
                      {episodeLabel}
                    </p>
                  )}
                  <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                    {titleLabel}
                  </h1>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <Link
                        href={
                          video.ownerId?._id ? `/studio/${video.ownerId._id}` : '#'
                        }
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]"
                      >
                        {video.ownerId?.avatar ? (
                          <Image
                            src={buildUrl(video.ownerId.avatar)}
                            alt={video.ownerId.username}
                            fill
                            sizes="56px"
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-bold text-black">
                            {(video.ownerId?.username ?? 'S').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={
                              video.ownerId?._id
                                ? `/studio/${video.ownerId._id}`
                                : '#'
                            }
                            className="min-w-0 text-base font-semibold text-white transition hover:text-amber-300 sm:text-lg"
                          >
                            <span className="block truncate sm:max-w-[320px] md:max-w-[420px] lg:max-w-[520px] xl:max-w-none">
                              {video.ownerId?.username ?? 'Unknown Studio'}
                            </span>
                          </Link>

                          {video.ownerId?.accountType === 'studio' && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                              <FiCheck className="text-[11px]" />
                              Studio
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-white/55">
                          Released {formatFullDate(video.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto xl:max-w-[520px] xl:justify-end">
                      <ActionButton
                        icon={isFollowed ? <FiCheck /> : <FiPlus />}
                        label={
                          submittingFollow
                            ? 'Saving...'
                            : isFollowed
                              ? 'Followed'
                              : 'Follow'
                        }
                        primary={!isFollowed}
                        active={isFollowed}
                        disabled={submittingFollow}
                        onClick={handleFollow}
                      />
                      <ActionButton
                        icon={<FiHeart />}
                        label={isLiked ? 'Liked' : 'Like'}
                        active={isLiked}
                        onClick={() => setIsLiked((prev) => !prev)}
                      />
                      <ActionButton
                        icon={<FiList />}
                        label={isSaved ? 'Saved' : 'Watchlist'}
                        active={isSaved}
                        onClick={() => setIsSaved((prev) => !prev)}
                      />
                      <Link
                        href={`/video/${video._id}/info`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        <FiInfo />
                        Info
                      </Link>
                      <ActionButton icon={<FiShare2 />} label="Share" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                      {isTvShow ? 'About this episode' : 'About this movie'}
                    </h2>
                    <span className="text-xs text-white/35">
                      {formatCompactDate(video.createdAt)}
                    </span>
                  </div>

                  <p
                    className={`text-sm leading-7 text-white/75 ${
                      showFullDescription ? '' : 'line-clamp-4'
                    }`}
                  >
                    {description}
                  </p>

                  {shouldCollapseDescription && (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription((prev) => !prev)}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-300 transition hover:text-amber-200"
                    >
                      {showFullDescription ? (
                        <>
                          <FiChevronUp />
                          Show less
                        </>
                      ) : (
                        <>
                          <FiChevronDown />
                          Show more
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                        Rate this title
                      </h2>
                      <p className="mt-2 text-sm text-white/65">
                        Your score updates the live rating shown at the top of the page.
                      </p>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/70">
                      {video.ratingsCount > 0
                        ? `${video.averageRating.toFixed(1)} average from ${video.ratingsCount} ratings`
                        : 'No ratings submitted yet'}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {Array.from({ length: 10 }, (_, index) => index + 1).map(
                      (value) => (
                        <RatingButton
                          key={value}
                          value={value}
                          active={userRating === value}
                          disabled={submittingRating}
                          onClick={handleRate}
                        />
                      ),
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-white/55">
                    <FiStar className="text-amber-300" />
                    <span>
                      {userRating
                        ? `Your rating: ${userRating}/10`
                        : 'Choose a score from 1 to 10'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </section>

            {isTvShow && (
              <aside className="xl:sticky xl:top-24 xl:self-start">
                <motion.div
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 }}
                  className="space-y-4"
                >
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">
                      Episodes
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-white">
                      {video.seriesTitle || video.title}
                    </h2>
                    <p className="mt-1 text-sm text-white/55">
                      {otherEpisodesCount > 0
                        ? `${otherEpisodesCount} other episodes`
                        : 'No other episodes in this series yet'}
                    </p>
                  </div>

                  <div className="space-y-5">
                    {seasonGroups.map((group) => (
                      <section key={group.seasonNumber} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                            Season {group.seasonNumber}
                          </h3>
                          <span className="text-xs text-white/35">
                            {group.episodes.length} episode
                            {group.episodes.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {group.episodes.map((episode) => (
                            <EpisodeCard
                              key={episode._id}
                              video={episode}
                              active={episode._id === videoId}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </motion.div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
