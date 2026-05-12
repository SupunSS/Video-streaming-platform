const DEFAULT_API_PORT = "3001";
const DEFAULT_LOCAL_API_URL = `http://localhost:${DEFAULT_API_PORT}`;

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

const isLoopbackHostname = (hostname: string) =>
  ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(hostname);

const getUrlHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

const inferBrowserApiUrl = () => {
  if (typeof window === "undefined") return DEFAULT_LOCAL_API_URL;

  const { hostname, protocol } = window.location;
  const apiHost = isLoopbackHostname(hostname) ? "localhost" : hostname;

  return `${protocol}//${apiHost}:${DEFAULT_API_PORT}`;
};

const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    const configuredHost = configuredUrl ? getUrlHostname(configuredUrl) : "";
    const shouldInferHostedApiUrl =
      !configuredUrl ||
      (!isLoopbackHostname(currentHost) && isLoopbackHostname(configuredHost));

    if (shouldInferHostedApiUrl) {
      return inferBrowserApiUrl();
    }
  }

  return stripTrailingSlash(configuredUrl || DEFAULT_LOCAL_API_URL);
};

export const API_CONFIG = {
  BASE_URL: resolveApiBaseUrl(),

  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      GOOGLE: "/auth/google",
      VERIFY_EMAIL: "/auth/verify-email",
      RESEND_VERIFICATION: "/auth/resend-verification",
    },

    VIDEOS: {
      ALL: "/videos",
      ME: "/videos/me",
      ONE: (id: string) => `/videos/${id}`,
      VIEWS: (id: string) => `/videos/${id}/views`,
      MY_RATING: (id: string) => `/videos/${id}/my-rating`,
      RATE: (id: string) => `/videos/${id}/rating`,
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

    ADMIN: {
      ME: "/admin/me",
      OVERVIEW: "/admin/overview",
      USERS: "/admin/users",
      BAN_USER: (id: string) => `/admin/users/${id}/ban`,
      UNBAN_USER: (id: string) => `/admin/users/${id}/unban`,
      VIDEOS: "/admin/videos",
      BAN_VIDEO: (id: string) => `/admin/videos/${id}/ban`,
      UNBAN_VIDEO: (id: string) => `/admin/videos/${id}/unban`,
    },
  },
};
