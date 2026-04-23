import { Video } from "@/types/video.types";

const LIBRARY_KEY = "video-library";

export const getLibraryVideos = (): Video[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLibraryVideos = (videos: Video[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(videos));
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
