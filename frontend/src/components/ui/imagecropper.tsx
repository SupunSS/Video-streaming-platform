'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiZoomIn, FiZoomOut } from 'react-icons/fi';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  imageSrc: string;
  onComplete: (croppedFile: File) => void;
  onCancel: () => void;
  aspect?: number;
  title?: string;
}

async function getCroppedImg(imageSrc: string, pixelCrop: CropArea, fileName: string): Promise<File> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      resolve(new File([blob], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}

export function ImageCropper({ imageSrc, onComplete, onCancel, aspect = 2 / 3, title = 'Crop Image' }: Props) {
  const [crop, setCrop]       = useState({ x: 0, y: 0 });
  const [zoom, setZoom]       = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: any, croppedPixels: CropArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels, 'poster.jpg');
      onComplete(file);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const CropperComponent = Cropper as any;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-[#0f1218] border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-white/40 mt-0.5">Drag to reposition · Scroll or pinch to zoom</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <FiX className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Cropper */}
          <div className="relative w-full bg-black" style={{ height: '420px' }}>
            <CropperComponent
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: { background: '#000' },
                cropAreaStyle: {
                  border: '2px solid rgba(245,158,11,0.8)',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                },
              }}
            />
          </div>

          {/* Zoom slider */}
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <FiZoomOut className="w-4 h-4 text-white/40 shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-amber-500 h-1 rounded-full"
              />
              <FiZoomIn className="w-4 h-4 text-white/40 shrink-0" />
              <span className="text-xs text-white/30 w-8 text-right">{zoom.toFixed(1)}x</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-5 pb-5">
            <button
              onClick={onCancel}
              className="px-5 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              disabled={processing}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
              Apply Crop
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}