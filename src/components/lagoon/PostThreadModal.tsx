import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AvatarSvg } from '../common/AvatarSvg';
import { X, Send, MapPin, Heart, MessageCircle } from 'lucide-react';

export const PostThreadModal: React.FC = () => {
  const {
    activePostId,
    setActivePostId,
    posts,
    addReply,
    currentUserMask,
    likePost,
  } = useAppStore();

  const [replyText, setReplyText] = useState('');

  if (!activePostId) return null;

  const post = posts.find((p) => p.id === activePostId);
  if (!post) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addReply(post.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[430px] bg-white dark:bg-[#081C1E] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-teal-800/40 shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-teal-900/30">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#0D5C63] dark:text-[#78CDA7]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Community Thread</h3>
          </div>
          <button
            onClick={() => setActivePostId(null)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Post Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B2124] border border-slate-200/80 dark:border-teal-900/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AvatarSvg seed={post.authorMask.avatarSeed} size={36} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{post.authorMask.nickname}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{post.district}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.createdAt}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => likePost(post.id)}
                className="flex items-center gap-1 text-xs text-rose-500 hover:opacity-80 transition-opacity"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span className="font-mono text-[11px]">{post.likes}</span>
              </button>
            </div>

            <div className="text-[11px] font-bold text-[#EE6C4D]">{post.prompt}</div>
            <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Replies Section */}
          <div className="space-y-2.5 pt-1">
            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Replies ({post.replies.length})
            </h5>

            {post.replies.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No replies yet. Be the first to chime in anonymously!
              </div>
            ) : (
              post.replies.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AvatarSvg seed={rep.authorMask.avatarSeed} size={26} />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        {rep.authorMask.nickname}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{rep.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                    {rep.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reply Composer Bar */}
        <form
          onSubmit={handleSendReply}
          className="p-3 border-t border-slate-200 dark:border-teal-900/30 bg-white dark:bg-[#081C1E] flex items-center gap-2"
        >
          <AvatarSvg seed={currentUserMask.avatarSeed} size={30} />
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply anonymously as ${currentUserMask.nickname}...`}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0D5C63]"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="p-2.5 rounded-xl bg-[#0D5C63] hover:bg-[#0a484e] disabled:opacity-40 text-white transition-all shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
