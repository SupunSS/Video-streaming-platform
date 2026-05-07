"use client";

import { useState, useEffect } from "react";
import { videoService, VideoResponse } from "@/services/video.service";
import { notify } from "@/components/ui/CustomToast";

export const useVideos = () => {
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videoService.getAll();
        setVideos(data);
      } catch {
        setError("Failed to load videos");
        notify.error("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return { videos, loading, error };
};
