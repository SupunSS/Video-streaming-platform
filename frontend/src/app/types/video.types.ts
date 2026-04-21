// src/types/video.types.ts
export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number;
  views: number;
  channel: string;
  uploadedAt?: string;
  status?: "processing" | "ready" | "failed";
  hlsUrl?: string;
  user?: {
    username: string;
    avatar?: string;
  };
}
