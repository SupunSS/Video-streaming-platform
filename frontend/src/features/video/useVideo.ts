"use client";

import { useState, useEffect } from "react";
import { videoService, VideoResponse } from "@/services/video.service";
import { notify } from "@/components/ui/CustomToast";
export const useVideo = (id: string) => {
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      try {
        const data = await videoService.getOne(id);
        setVideo(data);
        await videoService.incrementViews(id);
      } catch (err: any) {
        setError("Video not found");
        notify.error("Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  return { video, loading, error };
};
