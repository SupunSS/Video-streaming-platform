/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { FiThumbsUp, FiMoreVertical, FiSend } from 'react-icons/fi';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

interface CommentSectionProps {
  videoId: string;
}

const mockComments: Comment[] = [
  {
    id: '1',
    user: { name: 'NeonFan', avatar: 'https://i.pravatar.cc/150?img=1' },
    content: 'This is absolutely incredible! The neon aesthetic is perfect for this game.',
    createdAt: '3 days ago',
    likes: 245,
  },
  {
    id: '2',
    user: { name: 'CyberSamurai' },
    content: 'Great walkthrough! Would love to see more side missions explored.',
    createdAt: '1 week ago',
    likes: 128,
  },
  {
    id: '3',
    user: { name: 'PixelPusher', avatar: 'https://i.pravatar.cc/150?img=3' },
    content: 'The HDR really pops on my OLED monitor. Thanks for the high quality upload!',
    createdAt: '2 weeks ago',
    likes: 89,
  },
];

export const CommentSection: React.FC<CommentSectionProps> = ({ videoId }) => {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: { name: 'You' },
      content: newComment,
      createdAt: 'Just now',
      likes: 0,
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Comments ({comments.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('top')}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              sortBy === 'top' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-white/60 hover:text-white'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              sortBy === 'newest' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-white/60 hover:text-white'
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center flex-shrink-0">
          <span className="text-neon-cyan font-bold">Y</span>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="input-glass pr-12"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-cyan hover:text-neon-magenta disabled:opacity-50 transition-colors"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-neon-cyan/20 to-neon-magenta/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {comment.user.avatar ? (
                <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-neon-cyan font-bold">{comment.user.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white text-sm">{comment.user.name}</span>
                <span className="text-xs text-white/40">{comment.createdAt}</span>
              </div>
              <p className="text-white/80 text-sm mb-2">{comment.content}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    comment.isLiked ? 'text-neon-cyan' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <FiThumbsUp className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                  <span>{comment.likes}</span>
                </button>
                <button className="text-xs text-white/40 hover:text-white transition-colors">
                  Reply
                </button>
              </div>
            </div>
            <button className="text-white/40 hover:text-white transition-colors">
              <FiMoreVertical className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};