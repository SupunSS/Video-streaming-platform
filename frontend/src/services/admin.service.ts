import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export interface AdminOverview {
  metrics: {
    totalUsers: number;
    studioAccounts: number;
    viewerAccounts: number;
    bannedUsers: number;
    totalVideos: number;
    publishedVideos: number;
    bannedVideos: number;
    totalViews: number;
  };
  health: {
    status: "ok" | "error";
    service: string;
    timestamp: string;
    uptime: number;
    databaseState: string;
    checks: Record<string, "ok" | "error">;
    runtime: {
      nodeVersion: string;
      platform: string;
      environment: string;
      memory: {
        rssMb: number;
        heapUsedMb: number;
        heapTotalMb: number;
      };
    };
  };
}

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  authProvider: string;
  accountType: string;
  studioAgreementAccepted: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  banReason: string;
  bannedAt: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  videosCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  posterUrl: string;
  type: "movie" | "tv_show";
  genres: string[];
  categories: string[];
  isPublished: boolean;
  isFeatured: boolean;
  isBanned: boolean;
  banReason: string;
  bannedAt: string | null;
  views: number;
  ratingsCount: number;
  averageRating: number;
  owner: string;
  ownerId?: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    accountType: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardData {
  overview: AdminOverview;
  users: AdminUser[];
  videos: AdminVideo[];
}

export const adminService = {
  async getMe(): Promise<{ isAdmin: boolean; email: string }> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.ADMIN.ME);
    return res.data;
  },

  async getOverview(): Promise<AdminOverview> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.ADMIN.OVERVIEW);
    return res.data;
  },

  async listUsers(): Promise<AdminUser[]> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.ADMIN.USERS);
    return res.data;
  },

  async listVideos(): Promise<AdminVideo[]> {
    const res = await axiosInstance.get(API_CONFIG.ENDPOINTS.ADMIN.VIDEOS);
    return res.data;
  },

  async getDashboard(): Promise<AdminDashboardData> {
    const [overview, users, videos] = await Promise.all([
      this.getOverview(),
      this.listUsers(),
      this.listVideos(),
    ]);

    return { overview, users, videos };
  },

  async banVideo(id: string, reason?: string): Promise<AdminVideo> {
    const res = await axiosInstance.patch(API_CONFIG.ENDPOINTS.ADMIN.BAN_VIDEO(id), {
      reason,
    });
    return res.data;
  },

  async unbanVideo(id: string): Promise<AdminVideo> {
    const res = await axiosInstance.patch(API_CONFIG.ENDPOINTS.ADMIN.UNBAN_VIDEO(id));
    return res.data;
  },

  async banUser(id: string, reason?: string): Promise<AdminUser> {
    const res = await axiosInstance.patch(API_CONFIG.ENDPOINTS.ADMIN.BAN_USER(id), {
      reason,
    });
    return res.data;
  },

  async unbanUser(id: string): Promise<AdminUser> {
    const res = await axiosInstance.patch(API_CONFIG.ENDPOINTS.ADMIN.UNBAN_USER(id));
    return res.data;
  },
};
