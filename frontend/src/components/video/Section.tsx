import VideoCard from "./VideoCard";

const mockVideos = new Array(5).fill(0).map((_, i) => ({
  id: i.toString(),
  title: "Cyberpunk Video " + (i + 1),
  thumbnailUrl: "https://picsum.photos/400/250?random=" + i,
}));

export default function Section({ title }: { title: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button className="text-cyan-400">Show all</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockVideos.map((video) => (
          <VideoCard key={video.id} video={video as unknown} />
        ))}
      </div>
    </div>
  );
}