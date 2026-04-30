import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export type CommentSort = "top" | "newest";

export interface CommentAuthor {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface CommentResponse {
  _id: string;
  content: string;
  likes: number;
  isLiked: boolean;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export const commentService = {
  async getForVideo(
    videoId: string,
    sort: CommentSort,
  ): Promise<CommentResponse[]> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.COMMENTS.LIST(videoId), {
      params: { sort },
    });
    return res.data;
  },

  async create(videoId: string, content: string): Promise<CommentResponse> {
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.COMMENTS.CREATE(videoId),
      { content },
    );
    return res.data;
  },

  async toggleLike(
    videoId: string,
    commentId: string,
  ): Promise<CommentResponse> {
    const res = await axiosInstance.patch(
      API_CONFIG.ENDPOINTS.COMMENTS.LIKE(videoId, commentId),
    );
    return res.data;
  },
};
