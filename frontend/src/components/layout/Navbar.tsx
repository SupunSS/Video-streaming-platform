'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiSearch,
  FiBell,
  FiUpload,
  FiUser,
  FiX,
  FiSliders,
  FiLogOut,
  FiGrid,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, logout } from '@/store/slices/authSlice';
import { API_CONFIG } from '@/config/api.config';
import { userService } from '@/services/user.service';

const GENRES = [
  { label: 'All', emoji: '🎬' },
  { label: 'Action', emoji: '💥' },
  { label: 'Thriller', emoji: '🔪' },
  { label: 'Sci-Fi', emoji: '🚀' },
  { label: 'Horror', emoji: '👻' },
  { label: 'Drama', emoji: '🎭' },
  { label: 'Comedy', emoji: '😂' },
  { label: 'Romance', emoji: '❤️' },
  { label: 'Animation', emoji: '✨' },
  { label: 'Documentary', emoji: '🎥' },
  { label: 'Fantasy', emoji: '🧙' },
  { label: 'Crime', emoji: '🕵️' },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dropdownRef = useRef<HTMLDivElement>(null);

  

  const avatarSrc = user?.avatar
  ? user.avatar.startsWith('http')
    ? user.avatar
    : `${API_CONFIG.BASE_URL.replace(/\/$/, '')}/${user.avatar.replace(/^\/+/, '')}`
  : '';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const hydrateUser = async () => {
      if (!mounted) return;
      if (!isAuthenticated) return;
      if (user) return;

      try {
        const currentUser = await userService.getMe();
        dispatch(setUser(currentUser));
      } catch (error) {
        dispatch(logout());
      }
    };

    hydrateUser();
  }, [mounted, isAuthenticated, user, dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(searchQuery)}&genre=${
          activeGenre !== 'All' ? activeGenre : ''
        }`,
      );
    }
  };

  const handleGenreClick = (genre: string) => {
    setActiveGenre(genre);

    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(searchQuery)}&genre=${
          genre !== 'All' ? genre : ''
        }`,
      );
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveGenre('All');
    setFiltersOpen(false);
  };

  const toggleFilters = () => {
    setFiltersOpen((prev) => !prev);
    if (filtersOpen) setActiveGenre('All');
  };

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    router.push('/');
  };

  const hasActiveFilter = activeGenre !== 'All';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || filtersOpen
          ? 'bg-[#080a0f]/96 backdrop-blur-xl border-b border-white/[0.07]'
          : 'bg-gradient-to-b from-[#080a0f]/80 to-transparent backdrop-blur-sm'
      }`}
    >
      <div className="max-w-[1920px] mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 py-2">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <motion.div
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.2 }}
              className="relative w-10 h-10"
            >
              <Image
                src="/images/Flux_Logo.png"
                alt="Flux Logo"
                fill
                sizes="40px"
                className="object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                priority
              />
            </motion.div>

            <span
              className="text-xl font-black tracking-widest text-white hidden sm:inline"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.2em' }}
            >
              FLUX
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 shrink-0">
            {['Home', 'Library', 'Subscriptions'].map((item) => {
              const href = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
              const isActive =
                item === 'Home' ? pathname === '/' : pathname === `/${item.toLowerCase()}`;

              return (
                <Link
                  key={item}
                  href={href}
                  className={`relative text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-amber-400' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {item}
                  {isActive && mounted && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl mx-4 flex items-center gap-2"
          >
            <div
              className={`relative flex-1 transition-all duration-200 ${
                searchFocused ? 'scale-[1.02]' : ''
              }`}
            >
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, creators, genres…"
                className="w-full pl-11 pr-10 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.09] transition-all duration-200"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />

              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    onClick={clearSearch}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <FiX className="w-3 h-3 text-white/60" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              onClick={toggleFilters}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border shrink-0 transition-all duration-200 ${
                filtersOpen
                  ? 'bg-amber-500 border-amber-500 text-black'
                  : hasActiveFilter
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-white/[0.06] border-white/[0.08] text-white/60 hover:bg-white/[0.10] hover:text-white'
              }`}
            >
              {filtersOpen ? (
                <FiX className="w-4 h-4" />
              ) : (
                <FiSliders className="w-4 h-4" />
              )}

              <span className="hidden sm:inline">
                {filtersOpen ? 'Close' : hasActiveFilter ? activeGenre : 'Filter'}
              </span>

              {!filtersOpen && hasActiveFilter && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-[#080a0f]" />
              )}
            </motion.button>
          </form>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/upload"
              className="p-2 hover:bg-white/8 rounded-full transition-colors group"
              title="Upload"
            >
              <FiUpload className="w-5 h-5 text-white/60 group-hover:text-amber-400 transition-colors" />
            </Link>

            <button
              className="p-2 hover:bg-white/8 rounded-full transition-colors relative group"
              title="Notifications"
              type="button"
            >
              <FiBell className="w-5 h-5 text-white/60 group-hover:text-amber-400 transition-colors" />
              {mounted && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-1.5 ml-1 hover:bg-white/8 rounded-full transition-colors"
                type="button"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center border border-white/10">
                  {mounted && isAuthenticated && avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={user?.username || 'User avatar'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : mounted && isAuthenticated && user?.username ? (
                    <span className="text-black text-xs font-bold">
                      {user.username[0].toUpperCase()}
                    </span>
                  ) : (
                    <FiUser className="w-4 h-4 text-black" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-[#0f1218] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {mounted && isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            {avatarSrc ? (
                              <Image
                                src={avatarSrc}
                                alt={user?.username || 'User avatar'}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover object-center"
                              />
                            ) : (
                              <FiUser className="w-5 h-5 text-white/50" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {user?.username}
                            </p>
                            <p className="text-xs text-white/40 truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <FiGrid className="w-4 h-4" />
                          Dashboard
                        </Link>

                        <Link
                          href="/upload"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <FiUpload className="w-4 h-4" />
                          Upload Video
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/10"
                          type="button"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          Sign In
                        </Link>

                        <Link
                          href="/register"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div
                className="flex items-center gap-2 pb-3 overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {GENRES.map((genre) => {
                  const isActive = activeGenre === genre.label;

                  return (
                    <motion.button
                      key={genre.label}
                      onClick={() => handleGenreClick(genre.label)}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-all duration-150 ${
                        isActive
                          ? 'bg-amber-500 border-amber-500 text-black font-semibold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/55 hover:bg-white/[0.09] hover:text-white hover:border-white/[0.15]'
                      }`}
                      type="button"
                    >
                      <span className="text-[11px]">{genre.emoji}</span>
                      <span>{genre.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};