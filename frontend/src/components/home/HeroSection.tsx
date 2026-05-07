// src/components/home/HeroSection.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiPlay, FiInfo, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { Video } from '@/types/video.types';

interface HeroSectionProps {
  video: Video;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ video }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; duration: number; delay: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
  const ratingLabel =
    video.rating !== null && video.rating !== undefined && video.rating !== ''
      ? video.rating
      : 'No ratings yet';

  useEffect(() => {
    setMounted(true);
    setParticles(
      [...Array(20)].map(() => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity, scale }}
      className="relative w-full h-[85vh] min-h-[600px] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${video.thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%', // Keep subject away from top edge
          y: useTransform(scrollY, [0, 500], [0, 150]),
        }}
      >
        {/* 🔼 Stronger top gradient to prevent text overlapping navbar */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-500/90 via-dark-500/30 to-transparent" />
        
        {/* 🔽 Bottom gradient for smooth blend into content rows */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-500 via-dark-500/80 to-transparent" />
        
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </motion.div>

      {/* Centered Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold"
          >
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-magenta bg-clip-text text-transparent drop-shadow-lg">
              {video.title}
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center gap-4 text-white/80 text-sm md:text-base"
          >
            <span className="flex items-center gap-1"><span className="text-neon-cyan">★</span> {ratingLabel}</span>
            <span>•</span>
            <span>{video.year || '2024'}</span>
            <span>•</span>
            <span>7 Seasons</span>
            <span>•</span>
            <span className="px-2 py-0.5 border border-white/40 rounded text-xs">TV-MA</span>
            <span>•</span>
            <span className="bg-neon-cyan/20 px-2 py-0.5 rounded text-neon-cyan text-xs font-medium">#1 in TV Today</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto line-clamp-3"
          >
            {video.description || "Twisted tales run wild in this mind-bending anthology series that reveals humanity's worst traits, greatest innovations and more."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Link
              href={`/video/${video.id}`}
              className="btn-neon flex items-center gap-2 px-8 py-3 text-lg"
            >
              <FiPlay className="w-5 h-5" />
              <span>Play</span>
            </Link>
            <button className="px-6 py-3 bg-glass-light backdrop-blur-xl border border-white/20 rounded-lg hover:bg-glass-medium hover:border-white/40 transition-all duration-300 flex items-center gap-2 text-lg">
              <FiInfo className="w-5 h-5" />
              <span>More Info</span>
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-glass-light backdrop-blur-xl border border-white/20 rounded-full hover:border-white/40 transition-all duration-300"
            >
              {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-8"
          >
            <span className="inline-flex items-center gap-2 text-white/50 text-sm">
              <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
              Top 10 in Your Country Today
            </span>
          </motion.div>
        </div>
      </div>

      {/* Extra bottom fade layer for seamless blend */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-500 to-transparent pointer-events-none" />

      {mounted && isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-cyan rounded-full"
              initial={{ x: particle.x, y: particle.y, opacity: 0 }}
              animate={{ y: [null, -100], opacity: [0, 1, 0] }}
              transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
