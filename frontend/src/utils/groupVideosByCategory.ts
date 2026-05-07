import { Video } from "@/types/video.types";

export function groupVideosByCategory(videos: Video[]) {
  return videos.reduce<Record<string, Video[]>>((acc, video) => {
    for (const category of video.categories ?? []) {
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(video);
    }
    return acc;
  }, {});
}
