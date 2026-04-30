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

    COMMENTS: {
      LIST: (videoId: string) => `/videos/${videoId}/comments`,
      CREATE: (videoId: string) => `/videos/${videoId}/comments`,
      LIKE: (videoId: string, commentId: string) =>
        `/videos/${videoId}/comments/${commentId}/like`,
    },

    FOLLOWS: {
      FOLLOW: (targetId: string) => `/follows/${targetId}`,
      STATUS: (targetId: string) => `/follows/${targetId}/status`,
      FOLLOWERS: (userId: string) => `/follows/${userId}/followers`,
      FOLLOWING: (userId: string) => `/follows/${userId}/following`,
    },

    UPLOAD: {
      VIDEO: "/upload/video",
      THUMBNAIL: "/upload/thumbnail",
      POSTER: "/upload/poster",
    },
  },
};
