"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials, logout } from "@/store/slices/authSlice";
import {
  authService,
  LoginPayload,
  RegisterPayload,
} from "@/services/auth.service";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  const login = async (payload: LoginPayload) => {
    try {
      const data = await authService.login(payload);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      toast.success("Welcome back!");
      router.push("/");
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid credentials";
      toast.error(message);
      throw err;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const data = await authService.register(payload);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      toast.success("Account created!");
      router.push("/");
    } catch (err: any) {
      const message = err.response?.data?.message || "Registration failed";
      toast.error(message);
      throw err;
    }
  };

  const signOut = () => {
    dispatch(logout());
    toast.success("Signed out");
    router.push("/");
  };

  return { user, token, isAuthenticated, login, register, signOut };
};
