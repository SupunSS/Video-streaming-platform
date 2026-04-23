"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials, logout } from "@/store/slices/authSlice";
import {
  authService,
  LoginPayload,
  RegisterPayload,
} from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { notify } from "@/components/ui/CustomToast";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  const loginUser = async (payload: LoginPayload) => {
    try {
      const data = await authService.login(payload);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      notify.success("Welcome back!");
      router.push("/");
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid credentials";
      notify.error(message);
      throw err;
    }
  };

  const registerUser = async (payload: RegisterPayload) => {
    try {
      const data = await authService.register(payload);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      notify.success("Account created!");
      router.push("/");
    } catch (err: any) {
      const message = err.response?.data?.message || "Registration failed";
      notify.error(message);
      throw err;
    }
  };

  const signOut = () => {
    dispatch(logout());
    notify.success("Signed out");
    router.push("/");
  };

  return {
    user,
    token,
    isAuthenticated,
    loginUser,
    registerUser,
    signOut,
  };
};
