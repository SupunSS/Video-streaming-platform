export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",

  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      GOOGLE: "/auth/google",
    },

    VIDEOS: {
      ALL: "/videos",
      ME: "/videos/me",
      ONE: (id: string) => `/videos/${id}`,
      VIEWS: (id: string) => `/videos/${id}/views`,
      RATE: (id: string) => `/videos/${id}/rating`,
      MY_RATING: (id: string) => `/videos/${id}/my-rating`,
    },

    UPLOAD: {
      VIDEO: "/upload/video",
      THUMBNAIL: "/upload/thumbnail",
      POSTER: "/upload/poster",
    },
  },
};
