import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export type UploadFileResponse = {
  url: string;
  path?: string;
  thumbnailUrl?: string;
};

export const uploadService = {
  async uploadVideo(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.UPLOAD.VIDEO,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      },
    );
    return res.data;
  },

  async uploadThumbnail(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.UPLOAD.THUMBNAIL,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },

  async uploadPoster(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.UPLOAD.POSTER,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },
};
