import { Video } from "@/types/video.types";

const LIBRARY_KEY_PREFIX = "video-library";

type TokenPayload = {
  sub?: string;
  email?: string;
  username?: string;
};

const decodeTokenPayload = (token: string): TokenPayload | null => {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
};

const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

const getLibraryKey = () => {
  const token = getAccessToken();
  if (!token) return "";

  const payload = decodeTokenPayload(token);
  const accountId = payload?.sub ?? payload?.email ?? payload?.username;

  return accountId ? `${LIBRARY_KEY_PREFIX}:user:${accountId}` : "";
};

export const getLibraryVideos = (): Video[] => {
  if (typeof window === "undefined") return [];

  const key = getLibraryKey();
  if (!key) return [];

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLibraryVideos = (videos: Video[]) => {
  if (typeof window === "undefined") return;

  const key = getLibraryKey();
  if (!key) return;

  localStorage.setItem(key, JSON.stringify(videos));
};

export const isVideoInLibrary = (videoId: string) => {
  return getLibraryVideos().some((video) => video.id === videoId);
};

export const addVideoToLibrary = (video: Video) => {
  const key = getLibraryKey();
  if (!key) return;

  const current = getLibraryVideos();
  if (current.some((item) => item.id === video.id)) return;

  const updated = [video, ...current];
  saveLibraryVideos(updated);
  window.dispatchEvent(new Event("library-updated"));
};

export const removeVideoFromLibrary = (videoId: string) => {
  const key = getLibraryKey();
  if (!key) return;

  const updated = getLibraryVideos().filter((video) => video.id !== videoId);
  saveLibraryVideos(updated);
  window.dispatchEvent(new Event("library-updated"));
};

export const toggleLibraryVideo = (video: Video) => {
  const key = getLibraryKey();
  if (!key) return;

  if (isVideoInLibrary(video.id)) {
    removeVideoFromLibrary(video.id);
  } else {
    addVideoToLibrary(video);
  }
};
