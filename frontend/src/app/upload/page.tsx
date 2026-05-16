import VideoUploadForm from '@/components/upload/VideoUploadForm';

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin content upload</h1>
        <p className="mt-2 text-zinc-400">
          Add movies or TV show episodes to the FLUX catalog.
        </p>
      </div>

      <VideoUploadForm />
    </main>
  );
}
