export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
    },
    VIDEOS: {
      ALL: "/videos",
      ME: "/videos/me",
      ONE: (id: string) => `/videos/${id}`,
      VIEWS: (id: string) => `/videos/${id}/views`,
    },
    UPLOAD: {
      VIDEO: "/upload/video",
      THUMBNAIL: "/upload/thumbnail",
      POSTER: "/upload/poster", // 👈 add
    },
  },
};
