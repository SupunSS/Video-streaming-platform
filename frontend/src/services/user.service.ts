import axiosInstance from "@/lib/axios";

export interface CurrentUser {
  _id?: string;
  id?: string;
  email: string;
  username: string;
  avatar: string;
  accountType?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  avatar?: string;
}

export const userService = {
  async getMe(): Promise<CurrentUser> {
    const res = await axiosInstance.get("/users/me");
    return res.data;
  },

  async updateAvatar(avatar: string): Promise<CurrentUser> {
    const res = await axiosInstance.patch("/users/me/avatar", { avatar });
    return res.data;
  },

  // ✅ new method
  async updateProfile(payload: UpdateProfilePayload): Promise<CurrentUser> {
    const res = await axiosInstance.patch("/users/me/profile", payload);
    return res.data;
  },
};
