/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSend, FiThumbsUp } from 'react-icons/fi';

import { notify } from '@/components/ui/CustomToast';
import { API_CONFIG } from '@/config/api.config';
import {
  commentService,
  CommentResponse,
  CommentSort,
} from '@/services/comment.service';
import { useAppSelector } from '@/store/hooks';

interface CommentSectionProps {
  videoId: string;
}

const buildAvatarUrl = (avatar?: string) => {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  return `${API_CONFIG.BASE_URL.replace(/\/$/, '')}/${avatar.replace(/^\/+/, '')}`;
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const diffInSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (diffInSeconds < 60) return 'Just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const CommentSection: React.FC<CommentSectionProps> = ({ videoId }) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<CommentSort>('top');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const currentUserAvatar = useMemo(
    () => buildAvatarUrl(user?.avatar),
    [user?.avatar],
  );
  const currentUserInitial = user?.username?.charAt(0).toUpperCase() ?? 'U';

  useEffect(() => {
    let ignore = false;

    const loadComments = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await commentService.getForVideo(videoId, sortBy);
        if (!ignore) {
          setComments(data);
        }
      } catch (loadError) {
        console.error('Failed to load comments:', loadError);
        if (!ignore) {
          setError('Comments could not be loaded right now.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      ignore = true;
    };
  }, [sortBy, videoId]);

  const requireSignIn = () => {
    notify.error('Please sign in to comment');
    router.push('/login');
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();

    const content = newComment.trim();
    if (!content) return;

    if (!isAuthenticated) {
      requireSignIn();
      return;
    }

    try {
      setSubmitting(true);
      const created = await commentService.create(videoId, content);
      setComments((currentComments) => [created, ...currentComments]);
      setNewComment('');
      notify.success('Comment posted');
    } catch (submitError) {
      console.error('Failed to post comment:', submitError);
      notify.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      notify.error('Please sign in to like comments');
      router.push('/login');
      return;
    }

    try {
      setLikingId(commentId);
      const updated = await commentService.toggleLike(videoId, commentId);
      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment._id === updated._id ? updated : comment,
        ),
      );
    } catch (likeError) {
      console.error('Failed to like comment:', likeError);
      notify.error('Could not update comment like');
    } finally {
      setLikingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-white">
          Comments ({comments.length})
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortBy('top')}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              sortBy === 'top'
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => setSortBy('newest')}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              sortBy === 'newest'
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitComment} className="flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-neon-cyan/20 to-neon-magenta/20">
          {currentUserAvatar ? (
            <img
              src={currentUserAvatar}
              alt={user?.username ?? 'Your avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-bold text-neon-cyan">{currentUserInitial}</span>
          )}
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            onFocus={() => {
              if (!isAuthenticated) requireSignIn();
            }}
            placeholder={
              isAuthenticated ? 'Add a comment...' : 'Sign in to add a comment'
            }
            className="input-glass pr-12"
            maxLength={1000}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-cyan transition-colors hover:text-neon-magenta disabled:opacity-50"
            aria-label="Post comment"
          >
            <FiSend className="h-5 w-5" />
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex animate-pulse gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-2/3 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-sm font-medium text-white">No comments yet</p>
          <p className="mt-1 text-sm text-white/45">
            Start the conversation for this video.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const authorAvatar = buildAvatarUrl(comment.author.avatar);

            return (
              <div key={comment._id} className="flex gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-neon-cyan/20 to-neon-magenta/20">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={comment.author.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-neon-cyan">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {comment.author.username}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>

                  <p className="mb-2 whitespace-pre-wrap break-words text-sm text-white/80">
                    {comment.content}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleLikeComment(comment._id)}
                    disabled={likingId === comment._id}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      comment.isLiked
                        ? 'text-neon-cyan'
                        : 'text-white/40 hover:text-white'
                    } disabled:opacity-50`}
                    aria-label={
                      comment.isLiked ? 'Unlike comment' : 'Like comment'
                    }
                  >
                    <FiThumbsUp
                      className={`h-3 w-3 ${
                        comment.isLiked ? 'fill-current' : ''
                      }`}
                    />
                    <span>{comment.likes}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
