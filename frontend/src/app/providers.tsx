"use client";

import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "frontend/src/store/index";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        {children}
        <Toaster position="top-right" />
      </Provider>
    </GoogleOAuthProvider>
  );
}