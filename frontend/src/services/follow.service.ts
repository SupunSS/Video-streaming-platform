import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export const followService = {
  async follow(targetId: string) {
    const res = await axiosInstance.post(API_CONFIG.ENDPOINTS.FOLLOWS.FOLLOW(targetId));
    return res.data;
  },

  async unfollow(targetId: string) {
    const res = await axiosInstance.delete(API_CONFIG.ENDPOINTS.FOLLOWS.FOLLOW(targetId));
    return res.data;
  },

  async getStatus(targetId: string): Promise<{ isFollowing: boolean }> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.FOLLOWS.STATUS(targetId));
    return res.data;
  },
};
