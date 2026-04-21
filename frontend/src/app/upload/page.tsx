'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiImage, FiX } from 'react-icons/fi';
import { Navbar } from '@/components/layout/Navbar';
import { useUpload } from '@/features/upload/useUpload';  // 👈 our real upload hook

export default function UploadPage() {
  const router = useRouter();

  // 👇 pull everything we need from the hook
  // upload   = the function that does the actual uploading
  // videoProgress = 0-100 number, real progress from axios
  // isUploading   = true while uploading
  // status        = 'idle' | 'uploading' | 'processing' | 'complete'
  const { upload, videoProgress, isUploading, status } = useUpload();

  const [videoFile, setVideoFile]   = useState<File | null>(null);
  const [thumbnail, setThumbnail]   = useState<File | null>(null);
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags]             = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  // Called when user drops a video file
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      // Auto-fill title from filename (remove extension)
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
    if (file && file.type.startsWith('image/')) {
      setThumbnail(file);
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 👇 This is the real upload handler now
  // Instead of faking progress with setInterval,
  // we call the upload() function from our hook
  // which talks to the backend for real
  const handleUpload = async () => {
    if (!videoFile || !title) return;

    await upload(videoFile, thumbnail, { title, description });
    // redirect happens inside the hook after success
  };

  return (
    <div className="min-h-screen bg-cyber-gradient">
      <Navbar />

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
                               ? 'border-neon-cyan bg-neon-cyan/10 shadow-neon-cyan'
                               : 'border-white/20 hover:border-neon-cyan/50 hover:bg-glass-light'
                           }`}
              >
                <input {...getInputProps()} />
                <FiUploadCloud className={`w-16 h-16 mx-auto mb-4 ${
                  isDragActive ? 'text-neon-cyan' : 'text-white/40'
                }`} />
                <h3 className="text-xl font-semibold mb-2">
                  {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
                </h3>
                <p className="text-white/60 mb-4">or click to browse files</p>
                <p className="text-sm text-white/40">
                  Supported formats: MP4, MOV, AVI, MKV, WEBM (Max 2GB)
                </p>
              </motion.div>
            ) : (
              // ── FILE SELECTED CARD ──
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 rounded-lg flex items-center justify-center">
                      <FiUploadCloud className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="font-semibold">{videoFile.name}</p>
                      <p className="text-sm text-white/60">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {/* Only allow removing file if not currently uploading */}
                  {!isUploading && (
                    <button
                      onClick={() => setVideoFile(null)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <FiX className="w-5 h-5 text-white/60" />
                    </button>
                  )}
                </div>

                {/* ── REAL PROGRESS BAR ── */}
                {/* This shows real upload progress from axios, not fake */}
                {status !== 'idle' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">
                        {status === 'uploading'   && 'Uploading to server...'}
                        {status === 'processing'  && 'Saving video details...'}
                        {status === 'complete'    && '✓ Upload complete!'}
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

            {/* ── VIDEO DETAILS FORM ── */}
            {videoFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 space-y-6"
              >
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

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-medium mb-2">Thumbnail</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
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
                        className="w-40 h-24 bg-glass-light border-2 border-dashed border-white/20
                                 rounded-lg flex flex-col items-center justify-center cursor-pointer
                                 hover:border-neon-cyan/50 transition-colors"
                      >
                        {thumbnail ? (
                          <img
                            src={URL.createObjectURL(thumbnail)}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <>
                            <FiImage className="w-6 h-6 text-white/40 mb-1" />
                            <span className="text-xs text-white/40">Upload thumbnail</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-sm text-white/60">
                      Select or upload a picture that shows what&apos;s in your video.
                      A good thumbnail stands out and draws viewers&apos; attention.
                    </p>
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
                          <span
                            key={tag}
                            className="px-3 py-1 bg-glass-light border border-white/10 rounded-full text-sm flex items-center gap-2"
                          >
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

                {/* Action Buttons */}
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