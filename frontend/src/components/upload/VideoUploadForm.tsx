'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  FiUploadCloud,
  FiX,
  FiCrop,
  FiFilm,
  FiTv,
  FiStar,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { Navbar } from '@/components/layout/Navbar';
import { useUpload } from '@/features/upload/useUpload';
import { useAuth } from '@/features/auth/useAuth';
import { ImageCropper } from '@/components/ui/imagecropper';
import { videoService, VideoResponse } from '@/services/video.service';

type VideoType = 'movie' | 'tv_show';

const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Family',
  'History',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
] as const;

const CATEGORIES = [
  'Trending Now',
  'New Releases',
  'Popular on Flux',
  'Top Picks',
  'Recommended',
  'Award Winners',
  'Family',
  'Binge Worthy',
  'Continue Watching',
  'Coming Soon',
] as const;

const AGE_RATINGS = [
  'G',
  'PG',
  'PG-13',
  'R',
  'NC-17',
  'TV-Y',
  'TV-G',
  'TV-PG',
  'TV-14',
  'TV-MA',
] as const;

const LANGUAGES = [
  'English',
  'Sinhala',
  'Tamil',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Mandarin',
  'Portuguese',
  'Arabic',
] as const;

const MIN_RELEASE_YEAR = 1900;
const MAX_RELEASE_YEAR = 3000;
const YEAR_PAGE_SIZE = 12;

const getYearRangeStart = (year: number) => {
  const start = Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;
  return Math.min(
    Math.max(start, MIN_RELEASE_YEAR),
    MAX_RELEASE_YEAR - YEAR_PAGE_SIZE + 1,
  );
};

const formatVideoDuration = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds)) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
};

const getVideoDuration = (file: File) =>
  new Promise<number | undefined>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      cleanup();
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined);
    };
    video.onerror = () => {
      cleanup();
      resolve(undefined);
    };
    video.src = url;
  });

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { upload, videoProgress, isUploading, status } = useUpload();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | undefined>();
  const durationRequestId = useRef(0);

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'thumbnail' | 'poster' | null>(null);
  const [rawCropSrc, setRawCropSrc] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const [type, setType] = useState<VideoType>('movie');
  const [genres, setGenres] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [ageRating, setAgeRating] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [yearRangeStart, setYearRangeStart] = useState(() =>
    getYearRangeStart(new Date().getFullYear()),
  );
  const [isFeatured, setIsFeatured] = useState(false);

  const [seriesTitle, setSeriesTitle] = useState('');
  const [selectedSeriesTitle, setSelectedSeriesTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [myVideos, setMyVideos] = useState<VideoResponse[]>([]);

  const checkingAuth = !isAuthenticated;
  const isAdmin = user?.isAdmin === true;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user || !isAdmin) return;

    const loadAdminVideos = async () => {
      try {
        const data = await videoService.getMyVideos();
        setMyVideos(data);
      } catch (error) {
        console.error('Failed to load admin videos:', error);
      }
    };

    void loadAdminVideos();
  }, [isAuthenticated, isAdmin, user]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      if (posterPreview) URL.revokeObjectURL(posterPreview);
    };
  }, [thumbnailPreview, posterPreview]);

  const isTvShow = useMemo(() => type === 'tv_show', [type]);
  const seriesOptions = useMemo(() => {
    const seriesMap = new Map<
      string,
      { title: string; episodeCount: number; latestSeason: number; latestEpisode: number }
    >();

    myVideos
      .filter((video) => video.type === 'tv_show' && video.seriesTitle?.trim())
      .forEach((video) => {
        const title = video.seriesTitle!.trim();
        const key = title.toLowerCase();
        const current = seriesMap.get(key);
        const season = video.seasonNumber ?? 1;
        const episode = video.episodeNumber ?? 0;

        if (!current) {
          seriesMap.set(key, {
            title,
            episodeCount: 1,
            latestSeason: season,
            latestEpisode: episode,
          });
          return;
        }

        const isLaterEpisode =
          season > current.latestSeason ||
          (season === current.latestSeason && episode > current.latestEpisode);

        seriesMap.set(key, {
          ...current,
          episodeCount: current.episodeCount + 1,
          latestSeason: isLaterEpisode ? season : current.latestSeason,
          latestEpisode: isLaterEpisode ? episode : current.latestEpisode,
        });
      });

    return Array.from(seriesMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [myVideos]);
  const visibleYears = useMemo(
    () =>
      Array.from({ length: YEAR_PAGE_SIZE }, (_, index) => yearRangeStart + index).filter(
        (year) => year >= MIN_RELEASE_YEAR && year <= MAX_RELEASE_YEAR,
      ),
    [yearRangeStart],
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('video/')) {
      const requestId = durationRequestId.current + 1;
      durationRequestId.current = requestId;
      setVideoFile(file);
      setVideoDuration(undefined);
      void getVideoDuration(file).then((duration) => {
        if (durationRequestId.current === requestId) {
          setVideoDuration(duration);
        }
      });
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const openCropperForImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'thumbnail' | 'poster',
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawCropSrc(reader.result as string);
      setCropTarget(target);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    openCropperForImage(e, 'thumbnail');
  };

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    openCropperForImage(e, 'poster');
  };

  const handleCropComplete = (croppedFile: File) => {
    if (cropTarget === 'thumbnail') {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnail(croppedFile);
      setThumbnailPreview(URL.createObjectURL(croppedFile));
    }

    if (cropTarget === 'poster') {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
      setPoster(croppedFile);
      setPosterPreview(URL.createObjectURL(croppedFile));
    }

    setCropperOpen(false);
    setCropTarget(null);
    setRawCropSrc(null);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setCropTarget(null);
    setRawCropSrc(null);
  };

  const removePoster = () => {
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPoster(null);
    setPosterPreview(null);
  };

  const removeThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      const nextTag = currentTag.trim();
      if (!tags.includes(nextTag)) {
        setTags([...tags, nextTag]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const toggleArrayValue = (
    value: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) return;
    if (isTvShow && (!seriesTitle.trim() || !seasonNumber || !episodeNumber || !episodeTitle.trim())) {
      return;
    }

    const duration = videoDuration ?? await getVideoDuration(videoFile);
    if (duration) {
      setVideoDuration(duration);
    }

    await upload(videoFile, thumbnail, poster, {
      title: title.trim(),
      description: description.trim(),
      tags,
      type,
      genres,
      categories,
      language: language.trim(),
      ageRating: ageRating.trim(),
      releaseYear: releaseYear ? Number(releaseYear) : undefined,
      duration,
      isFeatured,
      seriesTitle: isTvShow ? seriesTitle.trim() : undefined,
      seasonNumber: isTvShow ? Number(seasonNumber) : undefined,
      episodeNumber: isTvShow ? Number(episodeNumber) : undefined,
      episodeTitle: isTvShow ? episodeTitle.trim() : undefined,
    });
  };

  const handleSelectSeries = (value: string) => {
    setSelectedSeriesTitle(value);

    if (!value) {
      setSeriesTitle('');
      return;
    }

    const selected = seriesOptions.find((option) => option.title === value);
    setSeriesTitle(value);

    if (selected && !seasonNumber) {
      setSeasonNumber(String(selected.latestSeason || 1));
    }

    if (selected && !episodeNumber) {
      setEpisodeNumber(String((selected.latestEpisode || 0) + 1));
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-cyber-gradient flex items-center justify-center">
        <div className="text-white/60 text-sm">Checking access...</div>
      </div>
    );
  }

  if (isAuthenticated && user && !isAdmin) {
    return (
      <div className="min-h-screen bg-cyber-gradient">
        <Navbar />
        <main className="flex min-h-screen items-center justify-center px-4 pt-24">
          <div className="glass-card max-w-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-white">Admin access required</h1>
            <p className="mt-3 text-sm text-white/55">
              Only FLUX admins can upload movies and TV show episodes.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-gradient">
      <Navbar />

      {cropperOpen && rawCropSrc && cropTarget && (
        <ImageCropper
          imageSrc={rawCropSrc}
          aspect={cropTarget === 'thumbnail' ? 16 / 9 : 2 / 3}
          title={cropTarget === 'thumbnail' ? 'Crop Landscape Thumbnail (16:9)' : 'Crop Portrait Poster (2:3)'}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <main className="pt-24 px-4 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-8 bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent"
          >
            Upload Video
          </motion.h1>

          <div className="space-y-6">
            {!videoFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                    transition-all duration-300 ${
                      isDragActive
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-white/20 hover:border-neon-cyan/50 hover:bg-glass-light'
                    }`}
                >
                  <input {...getInputProps()} />
                  <FiUploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-neon-cyan' : 'text-white/40'}`} />
                  <h3 className="text-xl font-semibold mb-2">
                    {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
                  </h3>
                  <p className="text-white/60 mb-4">or click to browse files</p>
                  <p className="text-sm text-white/40">Supported: MP4, MOV, AVI, MKV, WEBM (Max 2GB)</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 rounded-lg flex items-center justify-center">
                      <FiUploadCloud className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="font-semibold">{videoFile.name}</p>
                      <p className="text-sm text-white/60">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        {videoDuration ? ` - ${formatVideoDuration(videoDuration)}` : ''}
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={() => {
                        durationRequestId.current += 1;
                        setVideoFile(null);
                        setVideoDuration(undefined);
                      }}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <FiX className="w-5 h-5 text-white/60" />
                    </button>
                  )}
                </div>

                {status !== 'idle' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">
                        {status === 'uploading' && 'Uploading to server...'}
                        {status === 'processing' && 'Saving video details...'}
                        {status === 'complete' && '✓ Upload complete!'}
                      </span>
                      <span className="text-sm text-neon-cyan">{videoProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                        initial={{ width: 0 }}
                        animate={{ width: `${videoProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {videoFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('movie')}
                    disabled={isUploading}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      type === 'movie'
                        ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                        : 'border-white/10 bg-glass-light hover:border-neon-cyan/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiFilm className="w-5 h-5 text-neon-cyan" />
                      <span className="font-semibold">Movie</span>
                    </div>
                    <p className="text-sm text-white/55">Standalone title with one release entry.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('tv_show')}
                    disabled={isUploading}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      type === 'tv_show'
                        ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                        : 'border-white/10 bg-glass-light hover:border-neon-cyan/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiTv className="w-5 h-5 text-neon-cyan" />
                      <span className="font-semibold">TV Show</span>
                    </div>
                    <p className="text-sm text-white/55">Episode-based content with series metadata.</p>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isTvShow ? 'Enter episode or content title' : 'Enter movie title'}
                    className="input-glass"
                    disabled={isUploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about your video"
                    rows={4}
                    className="input-glass resize-none"
                    disabled={isUploading}
                  />
                </div>

                {isTvShow && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <label className="block text-sm font-medium mb-2">
                        Add to Existing Show
                      </label>
                      <select
                        value={selectedSeriesTitle}
                        onChange={(e) => handleSelectSeries(e.target.value)}
                        className="input-glass"
                        disabled={isUploading || seriesOptions.length === 0}
                      >
                        <option value="">
                          {seriesOptions.length === 0
                            ? 'No existing TV shows yet'
                            : 'Start a new show'}
                        </option>
                        {seriesOptions.map((show) => (
                          <option key={show.title} value={show.title}>
                            {show.title} - {show.episodeCount} episode
                            {show.episodeCount === 1 ? '' : 's'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium mb-2">Series Title *</label>
                      <input
                        type="text"
                        value={seriesTitle}
                        onChange={(e) => {
                          setSeriesTitle(e.target.value);
                          setSelectedSeriesTitle('');
                        }}
                        placeholder="Enter series title"
                        className="input-glass"
                        disabled={isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Season Number *</label>
                      <input
                        type="number"
                        min="1"
                        value={seasonNumber}
                        onChange={(e) => setSeasonNumber(e.target.value)}
                        placeholder="1"
                        className="input-glass"
                        disabled={isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Episode Number *</label>
                      <input
                        type="number"
                        min="1"
                        value={episodeNumber}
                        onChange={(e) => setEpisodeNumber(e.target.value)}
                        placeholder="1"
                        className="input-glass"
                        disabled={isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Episode Title *</label>
                      <input
                        type="text"
                        value={episodeTitle}
                        onChange={(e) => setEpisodeTitle(e.target.value)}
                        placeholder="Enter episode title"
                        className="input-glass"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Release Year</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setYearPickerOpen((prev) => !prev)}
                        className="input-glass flex items-center justify-between gap-3 text-left disabled:opacity-50"
                        disabled={isUploading}
                      >
                        <span className={releaseYear ? 'text-white' : 'text-white/40'}>
                          {releaseYear || 'Select year'}
                        </span>
                        <FiCalendar className="h-4 w-4 shrink-0 text-white/45" />
                      </button>

                      {yearPickerOpen && !isUploading && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-white/10 bg-[#0b0e1e] p-3 shadow-2xl">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setYearRangeStart((start) =>
                                  Math.max(start - YEAR_PAGE_SIZE, MIN_RELEASE_YEAR),
                                )
                              }
                              disabled={yearRangeStart <= MIN_RELEASE_YEAR}
                              className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-white/70 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <FiChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-xs font-semibold text-white/70">
                              {yearRangeStart} - {Math.min(yearRangeStart + YEAR_PAGE_SIZE - 1, MAX_RELEASE_YEAR)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setYearRangeStart((start) =>
                                  Math.min(
                                    start + YEAR_PAGE_SIZE,
                                    MAX_RELEASE_YEAR - YEAR_PAGE_SIZE + 1,
                                  ),
                                )
                              }
                              disabled={yearRangeStart + YEAR_PAGE_SIZE > MAX_RELEASE_YEAR}
                              className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-white/70 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <FiChevronRight className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {visibleYears.map((year) => {
                              const yearValue = String(year);
                              const selected = releaseYear === yearValue;

                              return (
                                <button
                                  key={year}
                                  type="button"
                                  onClick={() => {
                                    setReleaseYear(yearValue);
                                    setYearPickerOpen(false);
                                  }}
                                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                                    selected
                                      ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan'
                                      : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-neon-cyan/40 hover:text-white'
                                  }`}
                                >
                                  {year}
                                </button>
                              );
                            })}
                          </div>

                          {releaseYear && (
                            <button
                              type="button"
                              onClick={() => {
                                setReleaseYear('');
                                setYearPickerOpen(false);
                              }}
                              className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 text-xs text-white/55 transition hover:bg-white/[0.08] hover:text-white"
                            >
                              Clear year
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="input-glass"
                      disabled={isUploading}
                    >
                      <option value="">Select language</option>
                      {LANGUAGES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Age Rating</label>
                    <select
                      value={ageRating}
                      onChange={(e) => setAgeRating(e.target.value)}
                      className="input-glass"
                      disabled={isUploading}
                    >
                      <option value="">Select rating</option>
                      {AGE_RATINGS.map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setIsFeatured((prev) => !prev)}
                      disabled={isUploading}
                      className={`w-full rounded-xl border px-4 py-3 flex items-center justify-center gap-2 transition-all ${
                        isFeatured
                          ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                          : 'border-white/10 bg-glass-light hover:border-amber-400/30'
                      }`}
                    >
                      <FiStar className="w-4 h-4" />
                      {isFeatured ? 'Featured' : 'Mark Featured'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => {
                      const active = genres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleArrayValue(genre, genres, setGenres)}
                          disabled={isUploading}
                          className={`px-3 py-2 rounded-full text-sm border transition-all ${
                            active
                              ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                              : 'border-white/10 bg-glass-light text-white/70 hover:border-neon-cyan/30'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => {
                      const active = categories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleArrayValue(category, categories, setCategories)}
                          disabled={isUploading}
                          className={`px-3 py-2 rounded-full text-sm border transition-all ${
                            active
                              ? 'border-neon-magenta bg-neon-magenta/10 text-neon-magenta'
                              : 'border-white/10 bg-glass-light text-white/70 hover:border-neon-magenta/30'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Thumbnails</label>
                  <p className="text-xs text-white/40 mb-4">
                    Upload two cropped versions for the best look across all screens.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium text-white/60 mb-2">
                        Landscape <span className="text-amber-400">16:9</span>
                        <span className="text-white/30 ml-1">— video page header</span>
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                        id="thumbnail-upload"
                        disabled={isUploading}
                      />

                      {thumbnailPreview ? (
                        <div className="flex flex-col items-start gap-2">
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-amber-500/30">
                            <Image
                              src={thumbnailPreview}
                              alt="Thumbnail"
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              unoptimized
                              className="object-cover"
                            />
                            <label
                              htmlFor="thumbnail-upload"
                              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                            >
                              <FiCrop className="w-5 h-5 text-white" />
                              <span className="text-xs text-white">Re-crop</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={removeThumbnail}
                            className="text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <FiX className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="thumbnail-upload"
                          className="block w-full aspect-video bg-glass-light border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors overflow-hidden"
                        >
                          <div className="flex flex-col items-center gap-2 p-4">
                            <FiCrop className="w-8 h-8 text-white/30" />
                            <span className="text-xs text-white/40 text-center">Click to upload<br />& crop landscape</span>
                          </div>
                        </label>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-white/60 mb-2">
                        Portrait <span className="text-amber-400">2:3</span>
                        <span className="text-white/30 ml-1">— video cards & posters</span>
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterSelect}
                        className="hidden"
                        id="poster-upload"
                        disabled={isUploading}
                      />

                      {posterPreview ? (
                        <div className="flex flex-col items-start gap-2">
                          <div
                            className="relative rounded-lg overflow-hidden border border-amber-500/30"
                            style={{ width: '120px', height: '180px' }}
                          >
                            <Image
                              src={posterPreview}
                              alt="Poster"
                              fill
                              sizes="120px"
                              unoptimized
                              className="object-cover"
                            />
                            <label
                              htmlFor="poster-upload"
                              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                            >
                              <FiCrop className="w-5 h-5 text-white" />
                              <span className="text-xs text-white">Re-crop</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={removePoster}
                            className="text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <FiX className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="poster-upload"
                          className="block bg-glass-light border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors overflow-hidden"
                          style={{ width: '120px', height: '180px' }}
                        >
                          <div className="flex flex-col items-center gap-2 p-4">
                            <FiCrop className="w-8 h-8 text-white/30" />
                            <span className="text-xs text-white/40 text-center">Click to upload<br />& crop portrait</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={addTag}
                      placeholder="Add tags (press Enter)"
                      className="input-glass"
                      disabled={isUploading}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-glass-light border border-white/10 rounded-full text-sm flex items-center gap-2"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-neon-magenta transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={isUploading}
                    className="px-6 py-2 bg-glass-light border border-white/10 rounded-lg hover:bg-glass-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={
                      !title.trim() ||
                      !videoFile ||
                      isUploading ||
                      (isTvShow &&
                        (!seriesTitle.trim() || !seasonNumber || !episodeNumber || !episodeTitle.trim()))
                    }
                    className="btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Publish Video'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
