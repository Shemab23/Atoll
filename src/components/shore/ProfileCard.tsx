import React from 'react';
import { VerifiedProfile } from '../../types';
import { AvatarSvg } from '../common/AvatarSvg';
import { useAppStore } from '../../store/useAppStore';
import { MapPin, Heart, Send, Sparkles } from 'lucide-react';

interface ProfileCardProps {
  profile: VerifiedProfile;
  layout: 'deck' | 'grid';
  onSendIntro: (profile: VerifiedProfile) => void;
  onOpenDetails?: (profile: VerifiedProfile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  layout,
  onSendIntro,
  onOpenDetails,
}) => {
  const { likeShoreProfile } = useAppStore();

  const isLiked = profile.likedByCurrentUser;

  if (layout === 'grid') {
    return (
      <div
        onClick={() => onOpenDetails?.(profile)}
        className="p-3 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-2xs hover:border-sky-400 transition-all flex flex-col justify-between cursor-pointer group"
      >
        <div className="space-y-2">
          <div className="relative mx-auto flex justify-center pt-1">
            <AvatarSvg seed={profile.avatarSeed} size={58} isVerified={true} />
            {profile.likesCurrentUser && (
              <span className="absolute top-0 right-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[8px] font-bold border border-amber-300 flex items-center gap-0.5">
                <Sparkles className="w-2 h-2 text-[#EE6C4D]" />
                <span>Likes you</span>
              </span>
            )}
          </div>

          <div className="text-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {profile.firstName}, <span className="font-mono">{profile.age}</span>
            </h4>
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-sky-500" />
              <span>{profile.district}</span>
            </p>
          </div>

          <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed text-center">
            {profile.bio}
          </p>
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              likeShoreProfile(profile.id);
            }}
            className={`p-2 rounded-xl border transition-colors ${
              isLiked
                ? 'bg-rose-50 border-rose-300 text-rose-600'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendIntro(profile);
            }}
            className="flex-1 py-1.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>Intro</span>
          </button>
        </div>
      </div>
    );
  }

  // Deck layout (Full rich card)
  return (
    <article className="p-4 rounded-3xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-xs space-y-3.5 relative overflow-hidden">
      {/* Top Banner if they like you */}
      {profile.likesCurrentUser && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Liked Your Profile</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start gap-3">
        <AvatarSvg seed={profile.avatarSeed} size={54} isVerified={true} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {profile.firstName}
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{profile.age}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3 text-sky-600" />
            <span>{profile.district}</span>
            <span aria-hidden="true">·</span>
            <span className="text-sky-700 dark:text-sky-300 font-medium">{profile.datingIntent}</span>
          </div>

          {/* Languages */}
          <div className="text-[10px] text-slate-400 mt-0.5">
            Speaks: {profile.languages.join(', ')}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
        {profile.bio}
      </p>

      {/* Interests list (Unboxed text with separators per zero-pill discipline) */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Interests:</span>
        {profile.interests.map((interest, idx) => (
          <React.Fragment key={interest}>
            <span>{interest}</span>
            {idx < profile.interests.length - 1 && <span aria-hidden="true">·</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-teal-900/30">
        <button
          onClick={() => likeShoreProfile(profile.id)}
          className={`min-h-[42px] px-3.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
            isLiked
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-600 ring-1 ring-rose-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600'
          }`}
          title="Save to your Liked Profiles"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={() => onSendIntro(profile)}
          className="flex-1 min-h-[42px] px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Introduction</span>
        </button>
      </div>
    </article>
  );
};
