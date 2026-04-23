'use client';

import { VideoCard } from '@/components/video/VideoCard';
import { Video } from '@/types/video.types';

const mockVideos: Video[] = new Array(5).fill(0).map((_, i) => ({
  id: i.toString(),
  title: `Cyberpunk Video ${i + 1}`,
  thumbnail: `https://picsum.photos/400/600?random=${i}`,
  description: 'Demo video',
  duration: 120,
  views: 1000 + i * 100,
  channel: 'Vampier',
  createdAt: new Date().toISOString(),
  rating: 4.5,
  genre: 'Action',
  year: 2026,
}));

export default function Section({ title }: { title: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button className="text-cyan-400">Show all</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockVideos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            isActive={index === 1}
          />
        ))}
      </div>
    </div>
  );
}