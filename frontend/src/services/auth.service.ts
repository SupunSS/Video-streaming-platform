import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    email: string;
    username: string;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      payload,
    );
    return res.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      payload,
    );
    return res.data;
  },
};
