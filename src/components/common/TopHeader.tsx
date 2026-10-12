import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AvatarSvg } from './AvatarSvg';
import { Shield, Sparkles, SlidersHorizontal, Moon, Sun } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    language,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
    currentUserMask,
    currentUserVerifiedProfile,
    isDemoPanelOpen,
    setIsDemoPanelOpen,
    sparksBalance,
  } = useAppStore();

  const isShoreMode = currentTab === 'shore';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#081C1E]/95 backdrop-blur-md border-b border-teal-900/10 dark:border-teal-700/20 px-3.5 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Mode Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('lagoon')}
            className="flex items-baseline text-left font-extrabold text-xl tracking-tight text-[#0D5C63] dark:text-[#78CDA7] hover:opacity-90 transition-opacity"
          >
            <span>Atoll</span>
            <span className="text-[#EE6C4D] ml-0.5">//</span>
          </button>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
              isShoreMode
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                : 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
            }`}
          >
            {isShoreMode ? (
              <>
                <Shield className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                <span>Shore</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                <span>Lagoon</span>
              </>
            )}
          </span>
        </div>

        {/* Right: Quick actions (Language, Dark mode, Sparks, Demo toggle) */}
        <div className="flex items-center gap-1.5">
          {/* Sparks balance indicator */}
          <div
            title="Sparks Balance (tap to view)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200/60 dark:border-amber-800/40"
          >
            <Sparkles className="w-3 h-3 text-[#EE6C4D]" />
            <span className="font-mono text-[11px] tabular-nums">{sparksBalance}</span>
          </div>

          {/* Language Toggle EN / RW */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
            className="min-h-[34px] min-w-[34px] px-1.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            title="Toggle Language: English / Kinyarwanda"
          >
            {language === 'en' ? 'RW' : 'EN'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="min-h-[34px] min-w-[34px] p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Demo Controls Trigger */}
          <button
            onClick={() => setIsDemoPanelOpen(!isDemoPanelOpen)}
            className={`min-h-[34px] min-w-[34px] p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              isDemoPanelOpen
                ? 'bg-[#EE6C4D] text-white border-[#EE6C4D] shadow-sm'
                : 'bg-teal-50 dark:bg-teal-950/60 text-[#0D5C63] dark:text-[#78CDA7] border-teal-200 dark:border-teal-800 hover:bg-teal-100'
            }`}
            title="Open Demo Control Suite"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Active Mask Avatar Thumbnail */}
          <button
            onClick={() => setCurrentTab('me')}
            className="ml-0.5 hover:ring-2 hover:ring-[#78CDA7] rounded-full transition-all"
            title={isShoreMode ? `Verified Profile: ${currentUserVerifiedProfile.firstName}` : `Mask: ${currentUserMask.nickname}`}
          >
            <AvatarSvg
              seed={isShoreMode ? currentUserVerifiedProfile.avatarSeed : currentUserMask.avatarSeed}
              size={30}
              isVerified={isShoreMode}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
