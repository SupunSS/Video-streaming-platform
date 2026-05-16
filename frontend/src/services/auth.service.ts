import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar: string;
  accountType?: "user" | "studio";
  isAdmin?: boolean;
  isBanned?: boolean;
  emailVerified?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface EmailVerificationPendingResponse {
  requiresEmailVerification: true;
  email: string;
  message: string;
  verificationUrl?: string;
  alreadyVerified?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(
    payload: RegisterPayload,
  ): Promise<AuthResponse | EmailVerificationPendingResponse> {
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

  async googleLogin(credential: string): Promise<AuthResponse> {
    const res = await axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.GOOGLE, {
      credential,
    });

    return res.data;
  },

  async verifyEmail(token: string): Promise<AuthResponse> {
    const res = await axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
      token,
    });
    return res.data;
  },

  async resendVerification(
    email: string,
  ): Promise<EmailVerificationPendingResponse> {
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email },
    );
    return res.data;
  },
};
