'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiImage, FiX, FiCrop } from 'react-icons/fi';
import { Navbar } from '@/components/layout/Navbar';
import { useUpload } from '@/features/upload/useUpload';
import { useAuth } from '@/features/auth/useAuth';
import { ImageCropper } from '@/components/ui/imagecropper';

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { upload, videoProgress, isUploading, status } = useUpload();

  const [videoFile, setVideoFile]       = useState<File | null>(null);
  const [thumbnail, setThumbnail]       = useState<File | null>(null);
  const [poster, setPoster]             = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  // Cropper state
  const [cropperOpen, setCropperOpen]   = useState(false);
  const [rawPosterSrc, setRawPosterSrc] = useState<string | null>(null);

  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [tags, setTags]                 = useState<string[]>([]);
  const [currentTag, setCurrentTag]     = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    setCheckingAuth(false);
  }, [isAuthenticated, router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
    maxFiles: 1,
  });

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setThumbnail(file);
  };

  // When user picks a poster image, open the cropper first
  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawPosterSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // Called when user confirms the crop
  const handleCropComplete = (croppedFile: File) => {
    setPoster(croppedFile);
    setPosterPreview(URL.createObjectURL(croppedFile));
    setCropperOpen(false);
    setRawPosterSrc(null);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setRawPosterSrc(null);
  };

  const removePoster = () => {
    setPoster(null);
    setPosterPreview(null);
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!videoFile || !title) return;
    await upload(videoFile, thumbnail, poster, { title, description });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-cyber-gradient flex items-center justify-center">
        <div className="text-white/60 text-sm">Checking access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-gradient">
      <Navbar />

      {/* ── IMAGE CROPPER MODAL ── */}
      {cropperOpen && rawPosterSrc && (
        <ImageCropper
          imageSrc={rawPosterSrc}
          aspect={2 / 3}
          title="Crop Portrait Poster (2:3)"
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <main className="pt-24 px-4 lg:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-8 bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent"
          >
            Upload Video
          </motion.h1>

          <div className="space-y-6">
            {/* ── DROPZONE ── */}
            {!videoFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                  transition-all duration-300 ${
                    isDragActive
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-white/20 hover:border-neon-cyan/50 hover:bg-glass-light'
                  }`}
              >
                <input {...getInputProps()} />
                <FiUploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-neon-cyan' : 'text-white/40'}`} />
                <h3 className="text-xl font-semibold mb-2">
                  {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
                </h3>
                <p className="text-white/60 mb-4">or click to browse files</p>
                <p className="text-sm text-white/40">Supported: MP4, MOV, AVI, MKV, WEBM (Max 2GB)</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 rounded-lg flex items-center justify-center">
                      <FiUploadCloud className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="font-semibold">{videoFile.name}</p>
                      <p className="text-sm text-white/60">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button onClick={() => setVideoFile(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <FiX className="w-5 h-5 text-white/60" />
                    </button>
                  )}
                </div>

                {status !== 'idle' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">
                        {status === 'uploading' && 'Uploading to server...'}
                        {status === 'processing' && 'Saving video details...'}
                        {status === 'complete' && '✓ Upload complete!'}
                      </span>
                      <span className="text-sm text-neon-cyan">{videoProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                        initial={{ width: 0 }}
                        animate={{ width: `${videoProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── DETAILS FORM ── */}
            {videoFile && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    className="input-glass"
                    disabled={isUploading}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about your video"
                    rows={4}
                    className="input-glass resize-none"
                    disabled={isUploading}
                  />
                </div>

                {/* ── THUMBNAILS ── */}
                <div>
                  <label className="block text-sm font-medium mb-1">Thumbnails</label>
                  <p className="text-xs text-white/40 mb-4">
                    Upload two versions for the best look across all screens.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Landscape 16:9 */}
                    <div>
                      <p className="text-xs font-medium text-white/60 mb-2">
                        Landscape <span className="text-amber-400">16:9</span>
                        <span className="text-white/30 ml-1">— video page header</span>
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                        id="thumbnail-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="thumbnail-upload"
                        className="block w-full aspect-video bg-glass-light border-2 border-dashed border-white/20
                          rounded-lg flex flex-col items-center justify-center cursor-pointer
                          hover:border-amber-500/50 transition-colors overflow-hidden"
                      >
                        {thumbnail ? (
                          <img src={URL.createObjectURL(thumbnail)} alt="Thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-4">
                            <FiImage className="w-8 h-8 text-white/30" />
                            <span className="text-xs text-white/40 text-center">Click to upload<br />landscape image</span>
                          </div>
                        )}
                      </label>
                      {thumbnail && (
                        <button
                          onClick={() => setThumbnail(null)}
                          className="mt-1 text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <FiX className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>

                    {/* Portrait 2:3 with cropper */}
                    <div>
                      <p className="text-xs font-medium text-white/60 mb-2">
                        Portrait <span className="text-amber-400">2:3</span>
                        <span className="text-white/30 ml-1">— video cards & posters</span>
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterSelect}
                        className="hidden"
                        id="poster-upload"
                        disabled={isUploading}
                      />

                      {posterPreview ? (
                        // Show cropped preview with edit/remove options
                        <div className="flex flex-col items-start gap-2">
                          <div
                            className="relative rounded-lg overflow-hidden border border-amber-500/30"
                            style={{ width: '120px', height: '180px' }}
                          >
                            <img src={posterPreview} alt="Poster" className="w-full h-full object-cover" />
                            {/* Re-crop button overlay */}
                            <label
                              htmlFor="poster-upload"
                              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                            >
                              <FiCrop className="w-5 h-5 text-white" />
                              <span className="text-xs text-white">Re-crop</span>
                            </label>
                          </div>
                          <button
                            onClick={removePoster}
                            className="text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <FiX className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        // Upload box
                        <label
                          htmlFor="poster-upload"
                          className="block bg-glass-light border-2 border-dashed border-white/20
                            rounded-lg flex flex-col items-center justify-center cursor-pointer
                            hover:border-amber-500/50 transition-colors overflow-hidden"
                          style={{ width: '120px', height: '180px' }}
                        >
                          <div className="flex flex-col items-center gap-2 p-4">
                            <FiCrop className="w-8 h-8 text-white/30" />
                            <span className="text-xs text-white/40 text-center">Click to upload<br />& crop portrait</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={addTag}
                      placeholder="Add tags (press Enter)"
                      className="input-glass"
                      disabled={isUploading}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 bg-glass-light border border-white/10 rounded-full text-sm flex items-center gap-2">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-neon-magenta transition-colors">
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={() => router.back()}
                    disabled={isUploading}
                    className="px-6 py-2 bg-glass-light border border-white/10 rounded-lg hover:bg-glass-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!title || isUploading}
                    className="btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Publish Video'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}