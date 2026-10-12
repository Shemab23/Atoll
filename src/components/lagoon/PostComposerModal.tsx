import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PromptType, LagoonCategory } from '../../types';
import { AvatarSvg } from '../common/AvatarSvg';
import { X, MapPin, ShieldAlert, Sparkles } from 'lucide-react';

const PROMPT_OPTIONS: PromptType[] = [
  'Anyone up for...',
  'Does anyone else...',
  'I need advice on...',
  'Story time...',
];

const CATEGORIES: Array<Exclude<LagoonCategory, 'All' | 'My District'>> = [
  'Advice',
  'Fun',
  'Work',
  'Relationships',
];

export const PostComposerModal: React.FC = () => {
  const {
    isPostComposerOpen,
    setIsPostComposerOpen,
    currentUserMask,
    addPost,
  } = useAppStore();

  const [selectedPrompt, setSelectedPrompt] = useState<PromptType>('Anyone up for...');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Exclude<LagoonCategory, 'All' | 'My District'>>('Fun');
  const [isDistrictOnly, setIsDistrictOnly] = useState(false);

  if (!isPostComposerOpen) return null;

  const charLimit = 280;
  const remainingChars = charLimit - content.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addPost(selectedPrompt, content.trim(), category, isDistrictOnly);
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[430px] bg-white dark:bg-[#081C1E] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-teal-800/40 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-teal-900/30">
          <div className="flex items-center gap-2">
            <AvatarSvg seed={currentUserMask.avatarSeed} size={32} />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Posting as {currentUserMask.nickname}</h3>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-teal-600" />
                <span>{currentUserMask.district} · Mask Mode</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPostComposerOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Prompt Type selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Conversational Prompt
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PROMPT_OPTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                    selectedPrompt === prompt
                      ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-600 text-[#0D5C63] dark:text-[#78CDA7] ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-1.5">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
                rows={4}
                placeholder="Share your thought, question, or story..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#0D5C63] placeholder:text-slate-400"
              />
              <span
                className={`absolute right-3 bottom-3 text-[10px] font-mono font-bold ${
                  remainingChars < 20 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {remainingChars}
              </span>
            </div>
          </div>

          {/* Category Chip Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-slate-900 dark:bg-[#0D5C63] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* District constraint toggle */}
          <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/40 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Limit to my district only</h5>
              <p className="text-[10px] text-slate-500">Only people in {currentUserMask.district} will see this in their feed</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDistrictOnly(!isDistrictOnly)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isDistrictOnly ? 'bg-[#0D5C63]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isDistrictOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Safety reminder */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Safety scan active: Phone numbers, emails, and social media handles are automatically blocked in Lagoon mode.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!content.trim()}
            className="w-full py-3 px-4 rounded-xl bg-[#0D5C63] hover:bg-[#0a484e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#78CDA7]" />
            <span>Share to Lagoon Feed</span>
          </button>
        </form>
      </div>
    </div>
  );
};
