"use client";

import { useState } from "react";
import { uploadService } from "@/services/upload.service";
import { videoService, CreateVideoPayload } from "@/services/video.service";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export const useUpload = () => {
  const router = useRouter();
  const [videoProgress, setVideoProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "complete"
  >("idle");

  const upload = async (
    videoFile: File,
    thumbnailFile: File | null, // 16:9 landscape
    posterFile: File | null, // 2:3 portrait
    metadata: { title: string; description?: string },
  ) => {
    if (!videoFile || !metadata.title) return;

    setIsUploading(true);
    setStatus("uploading");

    try {
      // 1. Upload video file
      const { url: videoUrl } = await uploadService.uploadVideo(
        videoFile,
        (percent) => {
          setVideoProgress(percent);
        },
      );

      // 2. Upload landscape thumbnail (16:9) if provided
      let thumbnailUrl = "/uploads/thumbnails/default.jpg";
      if (thumbnailFile) {
        const { url } = await uploadService.uploadThumbnail(thumbnailFile);
        thumbnailUrl = url;
      }

      // 3. Upload portrait poster (2:3) if provided
      let posterUrl = "";
      if (posterFile) {
        const { url } = await uploadService.uploadPoster(posterFile);
        posterUrl = url;
      }

      setStatus("processing");

      // 4. Save metadata to DB
      const payload: CreateVideoPayload = {
        title: metadata.title,
        description: metadata.description,
        videoUrl,
        thumbnailUrl,
        posterUrl: posterUrl || thumbnailUrl, // fallback to thumbnail if no poster
      };

      await videoService.create(payload);

      setStatus("complete");
      toast.success("Video uploaded successfully!");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.message || "Upload failed";
      toast.error(message);
      setStatus("idle");
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, videoProgress, isUploading, status };
};
