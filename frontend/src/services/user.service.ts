import axiosInstance from "@/lib/axios";

export interface CurrentUser {
  _id?: string;
  id?: string;
  email: string;
  username: string;
  avatar: string;
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
};
