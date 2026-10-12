import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LagoonCategory } from '../../types';
import { LagoonPostCard } from './PostCard';
import { PostComposerModal } from './PostComposerModal';
import { PostThreadModal } from './PostThreadModal';
import { AvatarSvg } from '../common/AvatarSvg';
import { DICTIONARY } from '../../data/mock';
import { Plus, Shuffle, MapPin, Sparkles } from 'lucide-react';

const FILTER_ITEMS: LagoonCategory[] = [
  'All',
  'My District',
  'Advice',
  'Fun',
  'Work',
  'Relationships',
];

export const LagoonView: React.FC = () => {
  const {
    posts,
    categoryFilter,
    setCategoryFilter,
    currentUserMask,
    userMasks,
    switchUserMask,
    setIsPostComposerOpen,
    setActivePostId,
    language,
  } = useAppStore();

  const dict = DICTIONARY[language];

  // Filtering logic
  const visiblePosts = posts
    .filter((p) => !p.isHidden)
    .filter((p) => {
      if (categoryFilter === 'All') {
        // If post is district-only, only show if same district
        if (p.isDistrictOnly && p.district !== currentUserMask.district) return false;
        return true;
      }
      if (categoryFilter === 'My District') {
        return p.district === currentUserMask.district;
      }
      if (p.isDistrictOnly && p.district !== currentUserMask.district) return false;
      return p.category === categoryFilter;
    });

  // Cycle mask helper
  const handleCycleMask = () => {
    const currentIndex = userMasks.findIndex((m) => m.id === currentUserMask.id);
    const nextIndex = (currentIndex + 1) % userMasks.length;
    switchUserMask(userMasks[nextIndex].id);
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Mask Identity Ribbon */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border-b border-teal-900/10 dark:border-teal-800/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AvatarSvg seed={currentUserMask.avatarSeed} size={34} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {currentUserMask.nickname}
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-1.5 py-0.2 rounded-md font-mono">
                Active Mask
              </span>
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-teal-600" />
              <span>{currentUserMask.district}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCycleMask}
          className="min-h-[34px] py-1 px-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 text-[11px] font-semibold flex items-center gap-1 hover:bg-teal-50 transition-colors shadow-2xs"
          title="Switch between your active masks"
        >
          <Shuffle className="w-3 h-3 text-[#EE6C4D]" />
          <span>{dict.switchMask || 'Switch Mask'}</span>
        </button>
      </div>

      {/* Filter Tabs (Horizontal scroll segmented control) */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-teal-900/20 bg-white/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {FILTER_ITEMS.map((filter) => {
            const isActive = categoryFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setCategoryFilter(filter)}
                className={`min-h-[32px] px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#0D5C63] text-white shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter === 'All'
                  ? dict.filterAll || 'All'
                  : filter === 'My District'
                  ? dict.filterMyDistrict || 'My District'
                  : filter === 'Advice'
                  ? dict.filterAdvice || 'Advice'
                  : filter === 'Fun'
                  ? dict.filterFun || 'Fun'
                  : filter === 'Work'
                  ? dict.filterWork || 'Work'
                  : dict.filterRelationships || 'Relationships'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Composer CTA Banner */}
      <div className="p-3.5">
        <button
          onClick={() => setIsPostComposerOpen(true)}
          className="w-full p-3 rounded-2xl bg-white dark:bg-[#0B2124] border border-dashed border-teal-300 dark:border-teal-800/60 hover:border-teal-500 text-left flex items-center justify-between gap-3 shadow-2xs transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-[#0D5C63] dark:text-[#78CDA7] flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {dict.postComposerPlaceholder || 'Share a thought, dilemma, or ask Kigali...'}
            </span>
          </div>
          <span className="py-1 px-2.5 rounded-lg bg-[#0D5C63] text-white text-[10px] font-bold shrink-0">
            {dict.newPost || 'Post'}
          </span>
        </button>
      </div>

      {/* Posts Stream */}
      <div className="px-3.5 space-y-3">
        {visiblePosts.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <Sparkles className="w-6 h-6 mx-auto text-teal-500" />
            <p className="text-xs">No posts found in this filter.</p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <LagoonPostCard
              key={post.id}
              post={post}
              onOpenThread={(postId) => setActivePostId(postId)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <PostComposerModal />
      <PostThreadModal />
    </div>
  );
};
