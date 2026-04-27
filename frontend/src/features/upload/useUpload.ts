"use client";

import { useState } from "react";
import { uploadService } from "@/services/upload.service";
import { videoService, CreateVideoPayload } from "@/services/video.service";
import { useRouter } from "next/navigation";
import { notify } from "@/components/ui/CustomToast";

type UploadMetadata = {
  title: string;
  description?: string;
  tags?: string[];
  type?: "movie" | "tv_show";
  genres?: string[];
  categories?: string[];
  language?: string;
  ageRating?: string;
  releaseYear?: number;
  isFeatured?: boolean;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
};

export const useUpload = () => {
  const router = useRouter();
  const [videoProgress, setVideoProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "complete"
  >("idle");

  const upload = async (
    videoFile: File,
    thumbnailFile: File | null,
    posterFile: File | null,
    metadata: UploadMetadata,
  ) => {
    if (!videoFile || !metadata.title?.trim()) return;

    setIsUploading(true);
    setStatus("uploading");
    setVideoProgress(0);

    try {
      const { url: videoUrl } = await uploadService.uploadVideo(
        videoFile,
        (percent) => {
          setVideoProgress(percent);
        },
      );

      let thumbnailUrl = "/uploads/thumbnails/default.jpg";
      if (thumbnailFile) {
        const { url } = await uploadService.uploadThumbnail(thumbnailFile);
        thumbnailUrl = url;
      }

      let posterUrl = "";
      if (posterFile) {
        const { url } = await uploadService.uploadPoster(posterFile);
        posterUrl = url;
      }

      setStatus("processing");

      const payload: CreateVideoPayload = {
        title: metadata.title.trim(),
        description: metadata.description?.trim() ?? "",
        videoUrl,
        thumbnailUrl,
        posterUrl: posterUrl || thumbnailUrl,
        tags: metadata.tags ?? [],
        type: metadata.type ?? "movie",
        genres: metadata.genres ?? [],
        categories: metadata.categories ?? [],
        language: metadata.language?.trim() ?? "",
        ageRating: metadata.ageRating?.trim() ?? "",
        releaseYear: metadata.releaseYear,
        isFeatured: Boolean(metadata.isFeatured),
        seriesTitle: metadata.seriesTitle?.trim() ?? "",
        seasonNumber: metadata.seasonNumber,
        episodeNumber: metadata.episodeNumber,
        episodeTitle: metadata.episodeTitle?.trim() ?? "",
      };

      await videoService.create(payload);

      setStatus("complete");
      setVideoProgress(100);
      notify.success("Video uploaded successfully!");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Upload failed";
      notify.error(message);
      setStatus("idle");
      setVideoProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, videoProgress, isUploading, status };
};
