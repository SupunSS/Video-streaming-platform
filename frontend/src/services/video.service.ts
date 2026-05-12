import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export interface VideoOwner {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  accountType: string;
}

export interface VideoResponse {
  ratingsCount: number;
  averageRating: number;
  myRating?: number | null;
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string; // 16:9 for video page
  posterUrl?: string; // 2:3 for cards
  type?: "movie" | "tv_show";
  genres?: string[];
  categories?: string[];
  language?: string;
  ageRating?: string;
  releaseYear?: number;
  isFeatured?: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string | null;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  views: number;
  duration: number;
  createdAt: string;
  ownerId?: VideoOwner;
  ownerEmail?: string;
}

export interface CreateVideoPayload {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  posterUrl?: string;
  duration?: number;
  type?: "movie" | "tv_show";
  tags?: string[];
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
}

export const videoService = {
  async getAll(): Promise<VideoResponse[]> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.VIDEOS.ALL);
    return res.data;
  },

  async getMyVideos(): Promise<VideoResponse[]> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.VIDEOS.ME);
    return res.data;
  },

  async getOne(id: string): Promise<VideoResponse> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.VIDEOS.ONE(id));
    return res.data;
  },

  async create(payload: CreateVideoPayload): Promise<VideoResponse> {
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.VIDEOS.ALL,
      payload,
    );
    return res.data;
  },

  async incrementViews(id: string): Promise<VideoResponse> {
    const res = await axiosInstance.patch(
      API_CONFIG.ENDPOINTS.VIDEOS.VIEWS(id),
    );
    return res.data;
  },

  async getMyRating(id: string): Promise<{ value: number | null }> {
    const res = await axiosInstance.get(
      API_CONFIG.ENDPOINTS.VIDEOS.MY_RATING(id),
    );
    return res.data;
  },

  async rate(id: string, value: number): Promise<VideoResponse> {
    const res = await axiosInstance.patch(
      API_CONFIG.ENDPOINTS.VIDEOS.RATE(id),
      { value },
    );
    return res.data;
  },
};
