import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VerifiedProfile } from '../../types';
import { AvatarSvg } from '../common/AvatarSvg';
import { X, Send, Sparkles, MapPin, Heart } from 'lucide-react';

interface SendIntroModalProps {
  profile: VerifiedProfile | null;
  onClose: () => void;
}

export const SendIntroModal: React.FC<SendIntroModalProps> = ({ profile, onClose }) => {
  const {
    dailyIntrosRemaining,
    sendShoreIntro,
    sparksBalance,
    currentUserVerifiedProfile,
  } = useAppStore();

  const [message, setMessage] = useState('');

  if (!profile) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const ok = sendShoreIntro(profile.id, message.trim());
    if (ok) {
      onClose();
    }
  };

  const isFreeIntro = dailyIntrosRemaining > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#081C1E] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-teal-800/40 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-teal-900/30">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Send Introduction</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-5 space-y-4">
          {/* Target Profile Snippet */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/40 flex items-center gap-3">
            <AvatarSvg seed={profile.avatarSeed} size={42} isVerified={true} />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile.firstName}, {profile.age}
              </h4>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-sky-600" />
                <span>{profile.district}</span>
                <span aria-hidden="true">·</span>
                <span className="text-sky-700 dark:text-sky-300 font-medium">{profile.datingIntent}</span>
              </p>
            </div>
          </div>

          {/* Intros quota indicator */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500 text-[11px]">Daily Intros Quota:</span>
            {isFreeIntro ? (
              <span className="font-bold text-sky-600 font-mono text-[11px]">
                {dailyIntrosRemaining} of 5 free intros remaining
              </span>
            ) : (
              <span className="font-bold text-amber-600 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3 text-[#EE6C4D]" />
                <span>200 Sparks (Balance: {sparksBalance})</span>
              </span>
            )}
          </div>

          {/* Intro Message Area */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Your Note to {profile.firstName}
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${profile.firstName}, I loved your bio! What’s your favorite spot in Kigali?`}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-sky-600 placeholder:text-slate-400"
            />
            <p className="text-[10px] text-slate-400">
              Sending introduces your verified profile ({currentUserVerifiedProfile.firstName}, {currentUserVerifiedProfile.age}) directly into their Chats list.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Introduction</span>
          </button>
        </form>
      </div>
    </div>
  );
};
