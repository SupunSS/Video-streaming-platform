"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials, logout } from "@/store/slices/authSlice";
import {
  authService,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { notify } from "@/components/ui/CustomToast";
import { getErrorMessage } from "@/lib/api-error";
import {
  rememberAccount,
  RememberedAccount,
} from "@/lib/remembered-accounts";

type LoginOptions = {
  remember?: boolean;
};

const isAuthResponse = (value: unknown): value is AuthResponse =>
  typeof value === "object" &&
  value !== null &&
  "access_token" in value &&
  "user" in value;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  const loginUser = useCallback(async (payload: LoginPayload, options?: LoginOptions) => {
    try {
      const data = await authService.login(payload);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      if (options?.remember) {
        rememberAccount(data.user, data.access_token);
      }
      notify.success("Welcome back!");
      router.push("/");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Invalid credentials");
      notify.error(message);
      throw err;
    }
  }, [dispatch, router]);

  const googleLoginUser = useCallback(async (credential: string, options?: LoginOptions) => {
    try {
      const data = await authService.googleLogin(credential);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      if (options?.remember) {
        rememberAccount(data.user, data.access_token);
      }
      notify.success("Welcome back!");
      router.push(data.user.isAdmin ? "/admin" : "/");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Google login failed");
      notify.error(message);
      throw err;
    }
  }, [dispatch, router]);

  const registerUser = useCallback(async (payload: RegisterPayload) => {
    try {
      const data = await authService.register(payload);

      if (isAuthResponse(data)) {
        dispatch(setCredentials({ user: data.user, token: data.access_token }));
        notify.success("Account created!");
        router.push("/");
        return;
      }

      notify.success("Account created. Check your email to verify it.");
      const params = new URLSearchParams({ email: data.email });
      if (process.env.NODE_ENV !== "production" && data.verificationUrl) {
        params.set("devVerificationUrl", data.verificationUrl);
      }
      router.push(`/verify-email?${params.toString()}`);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Registration failed");
      notify.error(message);
      throw err;
    }
  }, [dispatch, router]);

  const signOut = useCallback(() => {
    dispatch(logout());
    notify.success("Signed out");
    router.push("/");
  }, [dispatch, router]);

  const switchRememberedAccount = useCallback((account: RememberedAccount) => {
    dispatch(setCredentials({ user: account.user, token: account.token }));
    rememberAccount(account.user, account.token);
    notify.success(`Switched to ${account.user.username}`);
    router.push(account.user.isAdmin ? "/admin" : "/");
  }, [dispatch, router]);

  return {
    user,
    token,
    isAuthenticated,
    loginUser,
    googleLoginUser,
    registerUser,
    switchRememberedAccount,
    signOut,
  };
};
