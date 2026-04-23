export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number;
  views: number;
  channel: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "processing" | "ready" | "failed";
  hlsUrl?: string;
  rating?: number | string;
  progress?: number;
  user?: {
    username: string;
    avatar?: string;
  };
}
