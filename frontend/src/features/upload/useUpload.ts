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
    thumbnailFile: File | null,
    metadata: { title: string; description?: string },
  ) => {
    if (!videoFile || !metadata.title) return;

    setIsUploading(true);
    setStatus("uploading");

    try {
      // Upload video file
      const { url: videoUrl } = await uploadService.uploadVideo(
        videoFile,
        (percent) => {
          setVideoProgress(percent);
        },
      );

      // Upload thumbnail if provided
      let thumbnailUrl = "/uploads/thumbnails/default.jpg";
      if (thumbnailFile) {
        const { url } = await uploadService.uploadThumbnail(thumbnailFile);
        thumbnailUrl = url;
      }

      setStatus("processing");

      // Save video metadata to DB
      const payload: CreateVideoPayload = {
        title: metadata.title,
        description: metadata.description,
        videoUrl,
        thumbnailUrl,
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
/*test commit for ci/cd pipeline*/
