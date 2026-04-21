"use client";

import { useState, useEffect } from "react";
import { videoService, VideoResponse } from "@/services/video.service";
import toast from "react-hot-toast";

export const useVideos = () => {
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videoService.getAll();
        setVideos(data);
      } catch (err: any) {
        setError("Failed to load videos");
        toast.error("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return { videos, loading, error };
};
