import type { Metadata } from 'next';
import './globals.css';
import Providers from "./providers";
import { StreamVaultToastContainer } from '@/components/ui/CustomToast';

export const metadata: Metadata = {
  title: 'Flux - Video Streaming Platform',
  description: 'Cloud-native video streaming platform',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/Flux_Logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <StreamVaultToastContainer />
        </Providers>
      </body>
    </html>
  );
}
