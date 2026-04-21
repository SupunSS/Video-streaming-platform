import axiosInstance from "@/lib/axios";
import { API_CONFIG } from "@/config/api.config";

export interface UploadResponse {
  url?: string;
  path?: string;
  thumbnailUrl?: string;
  filename?: string;
}

export const uploadService = {
  async uploadVideo(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<UploadResponse> {
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

    console.log("upload video response:", res.data);
    return res.data;
  },

  async uploadThumbnail(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosInstance.post(
      API_CONFIG.ENDPOINTS.UPLOAD.THUMBNAIL,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    console.log("upload thumbnail response:", res.data);
    return res.data;
  },
};
