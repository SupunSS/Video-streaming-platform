import mongoose, { Types } from 'mongoose';
import { promises as fs } from 'node:fs';
import path from 'node:path';

type UploadFile = {
  name: string;
  relativeUrl: string;
  mtime: Date;
  used: boolean;
};

const mongoUri =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/videoapp';

const resolveBackendPath = (...parts: string[]) =>
  path.resolve(process.cwd(), ...parts);

async function readUploadFiles(folder: string): Promise<UploadFile[]> {
  const uploadDir = resolveBackendPath('uploads', folder);
  const entries = await fs.readdir(uploadDir, { withFileTypes: true });

  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = path.join(uploadDir, entry.name);
        const stat = await fs.stat(filePath);

        return {
          name: entry.name,
          relativeUrl: `/uploads/${folder}/${entry.name}`,
          mtime: stat.mtime,
          used: false,
        };
      }),
  );

  return files.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
}

function findClosestAsset(
  video: UploadFile,
  assets: UploadFile[],
): UploadFile | undefined {
  const maxDistanceMs = 120_000;
  let best: UploadFile | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const asset of assets) {
    if (asset.used) continue;

    const distance = Math.abs(asset.mtime.getTime() - video.mtime.getTime());
    if (distance < bestDistance && distance <= maxDistanceMs) {
      best = asset;
      bestDistance = distance;
    }
  }

  if (best) {
    best.used = true;
  }

  return best;
}

function recoveredTitle(file: UploadFile): string {
  return `Recovered upload ${file.mtime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

async function main() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is not ready');
  }

  const users = db.collection('users');
  const videos = db.collection('videos');

  const owner =
    (await users.findOne(
      { accountType: 'studio' },
      { projection: { _id: 1, username: 1 } },
    )) ??
    (await users.findOne({}, { projection: { _id: 1, username: 1 } }));

  if (!owner?._id) {
    throw new Error('No user found. Create a studio account before recovery.');
  }

  const ownerId = new Types.ObjectId(owner._id.toString());

  const repairResult = await videos.updateMany(
    {},
    {
      $set: {
        owner: ownerId,
        isPublished: true,
      },
      $setOnInsert: {},
    },
  );

  const existingVideoUrls = new Set(
    (
      await videos
        .find({}, { projection: { videoUrl: 1, thumbnailUrl: 1, posterUrl: 1 } })
        .toArray()
    ).map((video) => video.videoUrl),
  );

  const usedThumbnails = new Set(
    (
      await videos
        .find({}, { projection: { thumbnailUrl: 1, posterUrl: 1 } })
        .toArray()
    ).flatMap((video) => [video.thumbnailUrl, video.posterUrl].filter(Boolean)),
  );

  const videoFiles = await readUploadFiles('videos');
  const thumbnailFiles = (await readUploadFiles('thumbnails')).map((file) => ({
    ...file,
    used: usedThumbnails.has(file.relativeUrl),
  }));
  const posterFiles = (await readUploadFiles('posters')).map((file) => ({
    ...file,
    used: usedThumbnails.has(file.relativeUrl),
  }));

  const newRecords = videoFiles
    .filter((file) => !existingVideoUrls.has(file.relativeUrl))
    .map((video) => {
      const thumbnail = findClosestAsset(video, thumbnailFiles);
      const poster = findClosestAsset(video, posterFiles);
      const createdAt = video.mtime;

      return {
        title: recoveredTitle(video),
        description: 'Recovered from an uploaded video file.',
        videoUrl: video.relativeUrl,
        thumbnailUrl:
          thumbnail?.relativeUrl || poster?.relativeUrl || '/uploads/thumbnails/default.jpg',
        posterUrl: poster?.relativeUrl || thumbnail?.relativeUrl || '',
        tags: [],
        type: 'movie',
        genres: [],
        categories: [],
        language: '',
        ageRating: '',
        isFeatured: false,
        isPublished: true,
        views: 0,
        ratingsCount: 0,
        averageRating: 0,
        seriesTitle: '',
        owner: ownerId,
        createdAt,
        updatedAt: createdAt,
      };
    });

  if (newRecords.length > 0) {
    await videos.insertMany(newRecords);
  }

  console.log(
    `Recovered ${newRecords.length} orphaned video(s). Repaired ${repairResult.modifiedCount} existing video record(s). Owner: ${owner.username ?? owner._id}`,
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Recovery failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
