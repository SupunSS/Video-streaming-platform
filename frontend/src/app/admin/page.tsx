'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiEye,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiVideo,
  FiX,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import {
  adminService,
  AdminDashboardData,
  AdminOverview,
  AdminUser,
  AdminVideo,
} from '@/services/admin.service';
import { notify } from '@/components/ui/CustomToast';
import { getErrorMessage } from '@/lib/api-error';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? 'border-red-400/25 bg-red-500/10 text-red-300'
          : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
      }`}
    >
      {active ? <FiAlertTriangle /> : <FiCheckCircle />}
      {active ? activeText : inactiveText}
    </span>
  );
}

function HealthPanel({ overview }: { overview: AdminOverview }) {
  const { health } = overview;
  const databaseOk = health.checks.database === 'ok';

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Server Health</h2>
          <p className="mt-1 text-sm text-white/40">{health.service}</p>
        </div>
        <StatusBadge active={health.status !== 'ok'} activeText="Attention" inactiveText="Healthy" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/8 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Uptime</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatUptime(health.uptime)}</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Database</p>
          <p className={`mt-2 text-lg font-semibold ${databaseOk ? 'text-emerald-300' : 'text-red-300'}`}>
            {health.databaseState}
          </p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Memory</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {health.runtime.memory.heapUsedMb} / {health.runtime.memory.heapTotalMb} MB
          </p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Runtime</p>
          <p className="mt-2 text-lg font-semibold text-white">{health.runtime.nodeVersion}</p>
        </div>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [busyVideoId, setBusyVideoId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const bannedCount = useMemo(
    () => data?.videos.filter((video) => video.isBanned).length ?? 0,
    [data],
  );

  const selectedUser = useMemo(
    () => data?.users.find((user) => user._id === selectedUserId) ?? null,
    [data, selectedUserId],
  );

  const selectedUserVideos = useMemo(
    () =>
      selectedUser
        ? data?.videos.filter((video) => video.owner === selectedUser._id) ?? []
        : [],
    [data, selectedUser],
  );

  const selectedVideo = useMemo(
    () => data?.videos.find((video) => video._id === selectedVideoId) ?? null,
    [data, selectedVideoId],
  );

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
        router.replace('/login');
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');
        setAccessDenied(false);
        await adminService.getMe();
        const dashboard = await adminService.getDashboard();
        setData(dashboard);
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setAccessDenied(true);
          return;
        }

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace('/login');
          return;
        }

        setError(getErrorMessage(err, 'Failed to load admin dashboard'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    const loadInitialDashboard = async () => {
      if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
        router.replace('/login');
        return;
      }

      try {
        await adminService.getMe();
        const dashboard = await adminService.getDashboard();
        if (cancelled) return;
        setData(dashboard);
        setError('');
        setAccessDenied(false);
      } catch (err: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setAccessDenied(true);
          return;
        }

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace('/login');
          return;
        }

        setError(getErrorMessage(err, 'Failed to load admin dashboard'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const replaceVideo = (updatedVideo: AdminVideo) => {
    setData((current) =>
      current
        ? {
            ...current,
            videos: current.videos.map((video) =>
              video._id === updatedVideo._id ? updatedVideo : video,
            ),
          }
        : current,
    );
  };

  const refreshOverview = async () => {
    const overview = await adminService.getOverview();
    setData((current) => (current ? { ...current, overview } : current));
  };

  const handleBanUser = async (user: AdminUser) => {
    const reason = window.prompt('Account ban reason', user.banReason || '');
    if (reason === null) return;

    try {
      setBusyUserId(user._id);
      await adminService.banUser(user._id, reason);
      await loadDashboard(true);
      notify.success('Account banned');
    } catch (err: unknown) {
      notify.error(getErrorMessage(err, 'Failed to ban account'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleUnbanUser = async (user: AdminUser) => {
    try {
      setBusyUserId(user._id);
      await adminService.unbanUser(user._id);
      await loadDashboard(true);
      notify.success('Account restored');
    } catch (err: unknown) {
      notify.error(getErrorMessage(err, 'Failed to restore account'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleBanVideo = async (video: AdminVideo) => {
    const reason = window.prompt('Ban reason', video.banReason || '');
    if (reason === null) return;

    try {
      setBusyVideoId(video._id);
      const updatedVideo = await adminService.banVideo(video._id, reason);
      replaceVideo(updatedVideo);
      await refreshOverview();
      notify.success('Video banned');
    } catch (err: unknown) {
      notify.error(getErrorMessage(err, 'Failed to ban video'));
    } finally {
      setBusyVideoId(null);
    }
  };

  const handleUnbanVideo = async (video: AdminVideo) => {
    try {
      setBusyVideoId(video._id);
      const updatedVideo = await adminService.unbanVideo(video._id);
      replaceVideo(updatedVideo);
      await refreshOverview();
      notify.success('Video restored');
    } catch (err: unknown) {
      notify.error(getErrorMessage(err, 'Failed to restore video'));
    } finally {
      setBusyVideoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-gradient text-white">
        <Navbar />
        <main className="flex min-h-screen items-center justify-center pt-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-sky-300" />
            <p className="text-sm text-white/45">Loading admin dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-cyber-gradient text-white">
        <Navbar />
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 pt-20 text-center">
          <FiShield className="mb-5 h-12 w-12 text-red-300" />
          <h1 className="text-3xl font-bold">Owner access required</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            This dashboard is protected by the backend owner allowlist.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
              <FiShield />
              Owner Admin
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-white/45">Accounts, server status, and content moderation.</p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="Total Users" value={data.overview.metrics.totalUsers} icon={<FiUsers />} />
              <MetricCard label="Banned Users" value={data.overview.metrics.bannedUsers} icon={<FiUserX />} />
              <MetricCard label="Videos" value={data.overview.metrics.totalVideos} icon={<FiVideo />} />
              <MetricCard label="Banned Videos" value={bannedCount} icon={<FiSlash />} />
              <MetricCard
                label="Total Views"
                value={data.overview.metrics.totalViews.toLocaleString()}
                icon={<FiActivity />}
              />
            </section>

            <HealthPanel overview={data.overview} />

            <section className="rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Accounts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/35">
                    <tr>
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Provider</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Videos</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {data.users.map((user) => (
                      <tr
                        key={user._id}
                        onClick={() => setSelectedUserId(user._id)}
                        className="cursor-pointer text-white/70 transition hover:bg-white/[0.035]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{user.username}</span>
                            {user.isAdmin && (
                              <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                                Owner
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">{user.email}</td>
                        <td className="px-5 py-4 capitalize">{user.accountType}</td>
                        <td className="px-5 py-4 capitalize">{user.authProvider}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              user.emailVerified
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : 'bg-amber-500/10 text-amber-300'
                            }`}
                          >
                            {user.emailVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge active={user.isBanned} activeText="Banned" inactiveText="Active" />
                        </td>
                        <td className="px-5 py-4">{user.videosCount}</td>
                        <td className="px-5 py-4">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-4">
                          {user.isBanned ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleUnbanUser(user);
                              }}
                              disabled={busyUserId === user._id}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
                            >
                              <FiUserCheck />
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleBanUser(user);
                              }}
                              disabled={busyUserId === user._id || user.isAdmin}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiUserX />
                              Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Video Moderation</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/35">
                    <tr>
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Owner</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Views</th>
                      <th className="px-5 py-3 font-medium">Uploaded</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {data.videos.map((video) => (
                      <tr
                        key={video._id}
                        onClick={() => setSelectedVideoId(video._id)}
                        className="cursor-pointer text-white/70 transition hover:bg-white/[0.035]"
                      >
                        <td className="max-w-sm px-5 py-4">
                          <p className="font-medium text-white">{video.title}</p>
                          {video.isBanned && video.banReason && (
                            <p className="mt-1 line-clamp-1 text-xs text-red-300/80">
                              {video.banReason}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p>{video.ownerId?.username ?? 'Unknown'}</p>
                          <p className="mt-0.5 text-xs text-white/35">{video.ownerId?.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge active={video.isBanned} activeText="Banned" inactiveText="Live" />
                        </td>
                        <td className="px-5 py-4">{video.views.toLocaleString()}</td>
                        <td className="px-5 py-4">{formatDate(video.createdAt)}</td>
                        <td className="px-5 py-4">
                          {video.isBanned ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleUnbanVideo(video);
                              }}
                              disabled={busyVideoId === video._id}
                              className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleBanVideo(video);
                              }}
                              disabled={busyVideoId === video._id}
                              className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                            >
                              Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#0b1020] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedUser.username}</h2>
                  {selectedUser.isAdmin && (
                    <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-semibold text-sky-200">
                      Owner
                    </span>
                  )}
                  <StatusBadge active={selectedUser.isBanned} activeText="Banned" inactiveText="Active" />
                </div>
                <p className="mt-1 text-sm text-white/45">{selectedUser.email}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                aria-label="Close account details"
              >
                <FiX />
              </button>
            </div>

            <div className="max-h-[calc(86vh-76px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Account Type</p>
                  <p className="mt-2 font-semibold capitalize text-white">{selectedUser.accountType}</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Provider</p>
                  <p className="mt-2 font-semibold capitalize text-white">{selectedUser.authProvider}</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Email</p>
                  <p className={`mt-2 font-semibold ${selectedUser.emailVerified ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {selectedUser.emailVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Videos</p>
                  <p className="mt-2 font-semibold text-white">{selectedUserVideos.length}</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Joined</p>
                  <p className="mt-2 font-semibold text-white">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {selectedUser.isBanned && selectedUser.banReason && (
                <div className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {selectedUser.banReason}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {selectedUser.isBanned ? (
                  <button
                    type="button"
                    onClick={() => void handleUnbanUser(selectedUser)}
                    disabled={busyUserId === selectedUser._id}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <FiUserCheck />
                    Restore Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleBanUser(selectedUser)}
                    disabled={busyUserId === selectedUser._id || selectedUser.isAdmin}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiUserX />
                    Ban Account
                  </button>
                )}
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Uploaded Videos</h3>
                  <span className="text-sm text-white/40">{selectedUserVideos.length} total</span>
                </div>

                {selectedUserVideos.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] py-10 text-center text-sm text-white/45">
                    This account has not uploaded videos.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedUserVideos.map((video) => (
                      <button
                        key={video._id}
                        type="button"
                        onClick={() => setSelectedVideoId(video._id)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-semibold text-white">{video.title}</p>
                            <p className="mt-1 text-xs text-white/40">
                              {video.views.toLocaleString()} views - {formatDate(video.createdAt)}
                            </p>
                          </div>
                          <StatusBadge active={video.isBanned} activeText="Banned" inactiveText="Live" />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-200">
                            <FiEye />
                            View details
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#0b1020] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedVideo.title}</h2>
                  <StatusBadge active={selectedVideo.isBanned} activeText="Banned" inactiveText="Live" />
                </div>
                <p className="mt-1 text-sm text-white/45">
                  {selectedVideo.ownerId?.username ?? 'Unknown'} - {selectedVideo.ownerId?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoId(null)}
                className="rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                aria-label="Close video details"
              >
                <FiX />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-white/60">
                {selectedVideo.description || 'No description provided.'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Views</p>
                  <p className="mt-2 font-semibold text-white">{selectedVideo.views.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Rating</p>
                  <p className="mt-2 font-semibold text-white">
                    {selectedVideo.ratingsCount > 0
                      ? selectedVideo.averageRating.toFixed(1)
                      : 'No ratings'}
                  </p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Uploaded</p>
                  <p className="mt-2 font-semibold text-white">{formatDate(selectedVideo.createdAt)}</p>
                </div>
              </div>

              {selectedVideo.isBanned && selectedVideo.banReason && (
                <div className="mt-5 rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {selectedVideo.banReason}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedVideo.isBanned ? (
                  <button
                    type="button"
                    onClick={() => void handleUnbanVideo(selectedVideo)}
                    disabled={busyVideoId === selectedVideo._id}
                    className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    Restore Video
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleBanVideo(selectedVideo)}
                    disabled={busyVideoId === selectedVideo._id}
                    className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                  >
                    Ban Video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
