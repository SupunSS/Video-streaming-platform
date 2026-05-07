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

const getLibraryKey = () => {
  if (typeof window === "undefined") return `${LIBRARY_KEY_PREFIX}:guest`;

  const token = localStorage.getItem("access_token");
  if (!token) return `${LIBRARY_KEY_PREFIX}:guest`;

  const payload = decodeTokenPayload(token);
  const accountId = payload?.sub ?? payload?.email ?? payload?.username;

  return accountId
    ? `${LIBRARY_KEY_PREFIX}:user:${accountId}`
    : `${LIBRARY_KEY_PREFIX}:guest`;
};

export const getLibraryVideos = (): Video[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getLibraryKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLibraryVideos = (videos: Video[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getLibraryKey(), JSON.stringify(videos));
};

export const isVideoInLibrary = (videoId: string) => {
  return getLibraryVideos().some((video) => video.id === videoId);
};

export const addVideoToLibrary = (video: Video) => {
  const current = getLibraryVideos();

  if (current.some((item) => item.id === video.id)) return;

  const updated = [video, ...current];
  saveLibraryVideos(updated);
  window.dispatchEvent(new Event("library-updated"));
};

export const removeVideoFromLibrary = (videoId: string) => {
  const updated = getLibraryVideos().filter((video) => video.id !== videoId);
  saveLibraryVideos(updated);
  window.dispatchEvent(new Event("library-updated"));
};

export const toggleLibraryVideo = (video: Video) => {
  if (isVideoInLibrary(video.id)) {
    removeVideoFromLibrary(video.id);
  } else {
    addVideoToLibrary(video);
  }
};
