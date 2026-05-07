import mongoose from 'mongoose';
import { promises as fs } from 'fs';
import path from 'path';

const folders = ['uploads/videos', 'uploads/thumbnails', 'uploads/posters'];

async function clearUploads() {
  for (const folder of folders) {
    const fullPath = path.resolve(folder);

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        await fs.rm(path.join(fullPath, entry.name), {
          recursive: true,
          force: true,
        });
      }

      console.log(`Cleared uploads: ${folder}`);
    } catch (error) {
      console.warn(`Skipped ${folder}:`, error);
    }
  }
}

async function clearDatabase() {
  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/video-streaming-platform';

  await mongoose.connect(mongoUri);

  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
    console.log(`Cleared collection: ${key}`);
  }

  await mongoose.disconnect();
}

async function main() {
  await clearDatabase();
  await clearUploads();
  console.log('App data reset complete.');
}

main().catch((error) => {
  console.error('Reset failed:', error);
  process.exit(1);
});
