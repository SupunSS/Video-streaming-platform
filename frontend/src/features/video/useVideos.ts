"use client";

import { useState, useEffect } from "react";
import { videoService, VideoResponse } from "@/services/video.service";
import { notify } from "@/components/ui/CustomToast";

const VIDEO_CACHE_TTL_MS = 60_000;

let cachedVideos: VideoResponse[] | null = null;
let cachedAt = 0;
let pendingVideosRequest: Promise<VideoResponse[]> | null = null;

const isCacheFresh = () =>
  cachedVideos !== null && Date.now() - cachedAt < VIDEO_CACHE_TTL_MS;

const loadVideos = async () => {
  if (isCacheFresh()) {
    return cachedVideos!;
  }

  if (!pendingVideosRequest) {
    pendingVideosRequest = videoService.getAll().then((data) => {
      cachedVideos = data;
      cachedAt = Date.now();
      return data;
    }).finally(() => {
      pendingVideosRequest = null;
    });
  }

  return pendingVideosRequest;
};

export const useVideos = () => {
  const [videos, setVideos] = useState<VideoResponse[]>(() => cachedVideos ?? []);
  const [loading, setLoading] = useState(() => !isCacheFresh());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchVideos = async () => {
      try {
        const data = await loadVideos();
        if (cancelled) return;
        setVideos(data);
      } catch {
        if (cancelled) return;
        setError("Failed to load videos");
        notify.error("Failed to load videos");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchVideos();

    return () => {
      cancelled = true;
    };
  }, []);

  return { videos, loading, error };
};
