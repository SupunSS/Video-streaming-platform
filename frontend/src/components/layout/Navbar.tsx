'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiBell,
  FiGrid,
  FiLogOut,
  FiSearch,
  FiSettings,
  FiSliders,
  FiUpload,
  FiUser,
  FiX,
} from 'react-icons/fi';

import { API_CONFIG } from '@/config/api.config';
import { userService } from '@/services/user.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, setUser } from '@/store/slices/authSlice';

const GENRES = [
  'All',
  'Action',
  'Thriller',
  'Sci-Fi',
  'Horror',
  'Drama',
  'Comedy',
  'Romance',
  'Animation',
  'Documentary',
  'Fantasy',
  'Crime',
];

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Subscriptions', href: '/subscriptions' },
];

const subscribeToClient = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const SEARCH_FILTERS_RESET_EVENT = 'search-filters-reset';

const getUrlSearchQuery = () => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('q') ?? '';
};

const getUrlGenres = () => {
  if (typeof window === 'undefined') return [];

  return new URLSearchParams(window.location.search)
    .getAll('genre')
    .flatMap((genre) => genre.split(','))
    .filter((genre) => genre && genre !== 'All');
};

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const isStudio = user?.accountType === 'studio';

  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState(getUrlSearchQuery);
  const [activeGenres, setActiveGenres] = useState<string[]>(getUrlGenres);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const avatarSrc = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${API_CONFIG.BASE_URL.replace(/\/$/, '')}/${user.avatar.replace(/^\/+/, '')}`
    : '';

  const showSearchControls =
    pathname === '/' ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/library' ||
    pathname.startsWith('/library/') ||
    pathname === '/search' ||
    pathname.startsWith('/video/') ||
    pathname.startsWith('/watch/');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResetSearchFilters = () => {
      setSearchQuery('');
      setActiveGenres([]);
      setFiltersOpen(false);
    };

    window.addEventListener(SEARCH_FILTERS_RESET_EVENT, handleResetSearchFilters);
    return () => {
      window.removeEventListener(SEARCH_FILTERS_RESET_EVENT, handleResetSearchFilters);
    };
  }, []);

  useEffect(() => {
    const hydrateUser = async () => {
      if (!mounted || !isAuthenticated || user) return;
      try {
        const currentUser = await userService.getMe();
        dispatch(setUser(currentUser));
      } catch {
        dispatch(logout());
      }
    };
    void hydrateUser();
  }, [mounted, isAuthenticated, user, dispatch]);

  const navigateToSearch = React.useCallback(
    (query: string, genres: string[], replace = pathname === '/search') => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      genres.forEach((genre) => params.append('genre', genre));

      const path = `/search${params.toString() ? `?${params.toString()}` : ''}`;
      if (replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
    },
    [pathname, router],
  );

  useEffect(() => {
    if (pathname !== '/search') return;

    const timeout = window.setTimeout(() => {
      navigateToSearch(searchQuery.trim(), activeGenres, true);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeGenres, navigateToSearch, pathname, searchQuery]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query && activeGenres.length === 0) return;
    navigateToSearch(query, activeGenres, false);
  };

  const handleGenreClick = (genre: string) => {
    const nextGenres =
      genre === 'All'
        ? []
        : activeGenres.includes(genre)
          ? activeGenres.filter((activeGenre) => activeGenre !== genre)
          : [...activeGenres, genre];

    setActiveGenres(nextGenres);
    navigateToSearch(searchQuery.trim(), nextGenres);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveGenres([]);
    setFiltersOpen(false);
    if (pathname === '/search') {
      router.replace('/search');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    router.push('/');
  };

  const hasActiveFilter = activeGenres.length > 0;
  const filterLabel =
    activeGenres.length === 0
      ? 'Filter'
      : activeGenres.length === 1
        ? activeGenres[0]
        : `${activeGenres.length} genres`;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-white/10 bg-[#060814]/88 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl'
            : 'bg-gradient-to-b from-[#060814]/90 via-[#060814]/45 to-transparent'
        }`}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">

       
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_30px_rgba(255,255,255,0.06)]">
                <Image
  src="/images/Flux_Logo.png"
  alt="Logo"
  width={120}
  height={40}
  className="h-10 w-auto object-contain"
/>
              </div>
              <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-xl font-black tracking-[0.18em] text-transparent">
                FLUX
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && mounted && (
                      <motion.span
                        layoutId="navbar-active-pill"
                        className="absolute inset-0 -z-10 rounded-full border border-white/10 bg-white/[0.08]"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

       
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">

          
            {showSearchControls && (
            <form
              onSubmit={handleSearch}
              className={`hidden items-center transition-all duration-300 md:flex ${
                searchFocused ? 'w-[360px]' : 'w-[300px]'
              }`}
            >
              <div className="relative w-full">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search titles, creators, genres…"
                  className="w-full rounded-full border border-white/[0.08] bg-white/[0.06] py-2.5 pl-11 pr-20 text-sm text-white placeholder:text-white/28 outline-none transition-all duration-200 focus:border-sky-400/40 focus:bg-white/[0.1]"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-11 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/35 transition hover:bg-white/[0.08] hover:text-white/75"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className={`absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all ${
                    filtersOpen || hasActiveFilter
                      ? 'bg-sky-400/15 text-sky-200'
                      : 'text-white/45 hover:bg-white/[0.08] hover:text-white/75'
                  }`}
                >
                  <FiSliders className="h-3.5 w-3.5" />
                  {!filtersOpen && hasActiveFilter ? filterLabel : 'Filter'}
                </button>
              </div>
            </form>
            )}

           
            {mounted && isAuthenticated && isStudio && (
              <Link
                href="/upload"
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white sm:inline-flex"
              >
                <FiUpload className="h-4 w-4" />
                Upload
              </Link>
            )}

            {/* Bell */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/65 transition hover:bg-white/[0.1] hover:text-white"
            >
              <FiBell className="h-4 w-4" />
            </button>

            {/* Avatar + Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1]"
              >
                {mounted && isAuthenticated && avatarSrc ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={avatarSrc}
                      alt={user?.username || 'User avatar'}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                ) : mounted && isAuthenticated && user?.username ? (
                  <span className="text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <FiUser className="h-[18px] w-[18px] text-white/75" />
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020]/96 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
                  >
                    {mounted && isAuthenticated ? (
                      <>
                        {/* User info header */}
                        <div className="border-b border-white/8 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                              {avatarSrc ? (
                                <Image
                                  src={avatarSrc}
                                  alt={user?.username || 'User avatar'}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-white/80">
                                  <FiUser className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {user?.username}
                              </p>
                              <p className="truncate text-xs text-white/45">{user?.email}</p>
                              {isStudio && (
                                <span className="mt-0.5 inline-block rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                                  Studio
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-2">
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <FiGrid className="h-4 w-4" />
                            Dashboard
                          </Link>

                 
                          <Link
                            href="/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <FiSettings className="h-4 w-4" />
                            Settings
                          </Link>

                          {/* Upload — studios only */}
                          {isStudio && (
                            <Link
                              href="/upload"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                            >
                              <FiUpload className="h-4 w-4" />
                              Upload Video
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                          >
                            <FiLogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2">
                        <Link
                          href="/login"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <FiUser className="h-4 w-4" />
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <FiGrid className="h-4 w-4" />
                          Create Account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Genre filter bar */}
        <AnimatePresence>
          {showSearchControls && filtersOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="pb-4"
            >
              <div className="overflow-x-auto">
                <div className="flex min-w-max items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-2 backdrop-blur-2xl">
                  {GENRES.map((genre) => {
                    const isActive =
                      genre === 'All'
                        ? activeGenres.length === 0
                        : activeGenres.includes(genre);
                    return (
                      <motion.button
                        key={genre}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => handleGenreClick(genre)}
                        className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-white text-[#060814] shadow-[0_0_20px_rgba(255,255,255,0.14)]'
                            : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        {genre}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
