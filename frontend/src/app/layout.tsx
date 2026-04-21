import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";          // 👈 add

export const metadata: Metadata = {
  title: "NEXUS - Video Streaming Platform",
  description: "Cloud-native video streaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-cyber-gradient antialiased">
        <Providers>                               {/* 👈 wrap */}
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}