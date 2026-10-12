import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { VerificationWall } from './VerificationWall';
import { ProfileCard } from './ProfileCard';
import { SendIntroModal } from './SendIntroModal';
import { AvatarSvg } from '../common/AvatarSvg';
import { VerifiedProfile } from '../../types';
import { DICTIONARY } from '../../data/mock';
import {
  ShieldCheck,
  LayoutGrid,
  SquareDashedBottom,
  Sparkles,
  Lock,
  Heart,
  Eye,
  Crown,
} from 'lucide-react';

export const ShoreView: React.FC = () => {
  const {
    verificationStatus,
    shoreProfiles,
    dailyIntrosRemaining,
    discoveryLayout,
    setDiscoveryLayout,
    isAtollPlusActive,
    openMoMoModal,
    language,
    setVerificationStatus,
  } = useAppStore();

  const [selectedIntroProfile, setSelectedIntroProfile] = useState<VerifiedProfile | null>(null);
  const [intentFilter, setIntentFilter] = useState<'all' | 'Serious relationship' | 'Marriage-minded' | 'Friendship first'>('all');
  const [showLikesModal, setShowLikesModal] = useState(false);

  const dict = DICTIONARY[language];

  // If user is not yet approved, render verification wall
  if (verificationStatus !== 'approved') {
    return <VerificationWall />;
  }

  // Filter profiles
  const filteredProfiles = shoreProfiles.filter((p) => {
    if (intentFilter === 'all') return true;
    return p.datingIntent === intentFilter;
  });

  const profilesWhoLikedUser = shoreProfiles.filter((p) => p.likesCurrentUser);

  return (
    <div className="flex-1 flex flex-col p-3.5 pb-20 space-y-3.5">
      {/* Isolation Assurance Top Banner */}
      <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            Shore Verified Dating Mode · Zero mask linkage
          </span>
        </div>
        <button
          onClick={() => setVerificationStatus('not_started')}
          className="text-[10px] text-sky-700 dark:text-sky-400 underline font-semibold hover:opacity-80"
          title="Re-run simulation of National ID verification"
        >
          Re-verify
        </button>
      </div>

      {/* Intros Counter & Layout Bar */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 shadow-2xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Introductions</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-sky-700 dark:text-sky-400 font-mono">
              {dailyIntrosRemaining} / 5
            </span>
            <span className="text-[11px] text-slate-500">{dict.introRemaining || 'intros left today'}</span>
          </div>
        </div>

        {/* List / Grid Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setDiscoveryLayout('deck')}
            className={`p-1.5 rounded-lg transition-all ${
              discoveryLayout === 'deck'
                ? 'bg-white dark:bg-teal-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Card Deck Layout"
          >
            <SquareDashedBottom className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDiscoveryLayout('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              discoveryLayout === 'grid'
                ? 'bg-white dark:bg-teal-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Grid Layout"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* "Profiles Who Liked You" (Atoll Plus feature) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Who Liked You ({profilesWhoLikedUser.length})
              </h4>
              {isAtollPlusActive ? (
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">
                  Unlocked
                </span>
              ) : (
                <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Plus</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAtollPlusActive
                ? 'Review verified singles who already swiped right on you'
                : 'Subscribe to Atoll Plus to unblur mutual admirers'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isAtollPlusActive) {
              setShowLikesModal(true);
            } else {
              openMoMoModal({
                title: 'Atoll Plus (1 Month)',
                amountRwf: 3000,
                type: 'plus',
                planDuration: 'month',
              });
            }
          }}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 transition-colors ${
            isAtollPlusActive
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
          }`}
        >
          {isAtollPlusActive ? 'View Likes' : 'Unlock (3k RWF)'}
        </button>
      </div>

      {/* Intent Filters */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {(['all', 'Serious relationship', 'Marriage-minded', 'Friendship first'] as const).map((intent) => (
          <button
            key={intent}
            onClick={() => setIntentFilter(intent)}
            className={`min-h-[30px] px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
              intentFilter === intent
                ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {intent === 'all' ? 'All Intentions' : intent}
          </button>
        ))}
      </div>

      {/* Profiles Deck / Grid */}
      <div className={discoveryLayout === 'grid' ? 'grid grid-cols-2 gap-2.5' : 'space-y-3'}>
        {filteredProfiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            layout={discoveryLayout}
            onSendIntro={(p) => setSelectedIntroProfile(p)}
          />
        ))}
      </div>

      {/* Send Intro Modal */}
      <SendIntroModal
        profile={selectedIntroProfile}
        onClose={() => setSelectedIntroProfile(null)}
      />

      {/* Profiles Who Liked You Drawer/Modal */}
      {showLikesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[420px] bg-white dark:bg-[#081C1E] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-teal-800/40 p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-teal-900/30">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profiles Who Liked You</h3>
              </div>
              <button
                onClick={() => setShowLikesModal(false)}
                className="text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5">
              {profilesWhoLikedUser.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <AvatarSvg seed={p.avatarSeed} size={40} isVerified={true} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.firstName}, {p.age}
                      </h4>
                      <p className="text-[10px] text-slate-500">{p.district} · {p.datingIntent}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowLikesModal(false);
                      setSelectedIntroProfile(p);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-sky-600 text-white text-xs font-bold"
                  >
                    Say Hello
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
