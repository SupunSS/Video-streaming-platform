import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      payload,
    );
    return res.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      payload,
    );
    return res.data;
  },
};
