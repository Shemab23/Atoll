import React from 'react';
import { LagoonPost } from '../../types';
import { AvatarSvg } from '../common/AvatarSvg';
import { useAppStore } from '../../store/useAppStore';
import { MessageCircle, Send, Heart, Sparkles, MapPin, Flag } from 'lucide-react';

interface PostCardProps {
  post: LagoonPost;
  onOpenThread: (postId: string) => void;
}

export const PostCard: React.FC = () => null; // placeholder for typing

export const LagoonPostCard: React.FC<PostCardProps> = ({ post, onOpenThread }) => {
  const {
    likePost,
    startOrOpenChatWithMask,
    boostPost,
    currentUserMask,
    addToast,
    addSystemLog,
  } = useAppStore();

  const isAuthor = post.authorMask.id === currentUserMask.id;

  const handleFlag = (e: React.MouseEvent) => {
    e.stopPropagation();
    addSystemLog(
      'post_reported_by_user',
      `Post by "${post.authorMask.nickname}" reported for moderation review.`,
      'warning'
    );
    addToast('Post Reported', 'Thank you for keeping Atoll safe. Sent to moderators.', 'info');
  };

  return (
    <article
      onClick={() => onOpenThread(post.id)}
      className={`p-4 rounded-2xl bg-white dark:bg-[#0B2124] border transition-all cursor-pointer hover:border-teal-400/50 relative ${
        post.isBoosted
          ? 'border-amber-300 dark:border-amber-700/60 shadow-xs ring-1 ring-amber-400/30'
          : 'border-slate-200/90 dark:border-teal-900/40 shadow-xs'
      }`}
    >
      {/* Boosted indicator banner */}
      {post.isBoosted && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-2">
          <Sparkles className="w-3 h-3 text-[#EE6C4D]" />
          <span>Spotlighted with Sparks</span>
        </div>
      )}

      {/* Author & Header Metadata (Zero-pill unboxed text with separators) */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <AvatarSvg seed={post.authorMask.avatarSeed} size={36} />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {post.authorMask.nickname}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                <span>{post.district}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{post.createdAt}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#0D5C63] dark:text-[#78CDA7] font-medium">{post.category}</span>
            </div>
          </div>
        </div>

        {/* Flag button */}
        <button
          onClick={handleFlag}
          className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Report this post to moderators"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Prompt Kicker */}
      <div className="text-[11px] font-semibold text-[#EE6C4D] tracking-wide mb-1">
        {post.prompt}
      </div>

      {/* Post Content */}
      <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-100 mb-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Footer Actions (Reply, Chat Privately, Like, Boost) */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-teal-950 text-xs">
        <div className="flex items-center gap-2">
          {/* Reply button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenThread(post.id);
            }}
            className="min-h-[34px] px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#0D5C63] dark:text-[#78CDA7]" />
            <span className="font-semibold text-[11px]">{post.replies.length}</span>
            <span className="text-[11px] hidden xs:inline">Replies</span>
          </button>

          {/* Chat Privately button (splits into 1:1 masked DM) */}
          {!isAuthor && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startOrOpenChatWithMask(post.authorMask);
              }}
              className="min-h-[34px] px-2.5 py-1 rounded-lg text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 flex items-center gap-1.5 transition-colors font-medium text-[11px]"
              title="Start a 1:1 anonymous DM with this mask"
            >
              <Send className="w-3 h-3 text-[#0D5C63] dark:text-[#78CDA7]" />
              <span>Chat Privately</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Boost Post with Sparks button (if author) */}
          {isAuthor && !post.isBoosted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                boostPost(post.id);
              }}
              className="min-h-[34px] px-2 py-1 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 flex items-center gap-1 text-[11px] font-semibold transition-colors"
              title="Boost in Lagoon for 24 hours (500 Sparks)"
            >
              <Sparkles className="w-3 h-3 text-[#EE6C4D]" />
              <span>Boost</span>
            </button>
          )}

          {/* Like button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              likePost(post.id);
            }}
            className="min-h-[34px] px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition-colors"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-mono text-[11px] tabular-nums font-semibold">{post.likes}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
