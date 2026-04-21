import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export interface VideoResponse {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  duration: number;
  createdAt: string;
}

export interface CreateVideoPayload {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: number;
}

export const videoService = {
  async getAll(): Promise<VideoResponse[]> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.VIDEOS.ALL);
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
};
