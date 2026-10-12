import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AvatarSvg } from '../common/AvatarSvg';
import { RwandanDistrict, Mask } from '../../types';
import { DICTIONARY } from '../../data/mock';
import {
  ShieldCheck,
  Crown,
  Sparkles,
  Shuffle,
  Plus,
  Moon,
  Sun,
  EyeOff,
  Globe,
  RotateCcw,
  ExternalLink,
  MapPin,
  Check,
} from 'lucide-react';

const DISTRICTS: RwandanDistrict[] = [
  'Gasabo',
  'Kicukiro',
  'Nyarugenge',
  'Musanze',
  'Rubavu',
  'Huye',
  'Rwamagana',
  'Bugesera',
  'Muhanga',
  'Rusizi',
];

export const ProfileView: React.FC = () => {
  const {
    currentUserMask,
    userMasks,
    switchUserMask,
    createCustomMask,
    currentUserVerifiedProfile,
    updateCurrentUserVerifiedProfile,
    verificationStatus,
    isAtollPlusActive,
    atollPlusExpiry,
    sparksBalance,
    openMoMoModal,
    language,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
    isDiscreetMode,
    toggleDiscreetMode,
    resetDemoState,
    setCurrentTab,
    setIsDemoPanelOpen,
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'masks' | 'shore' | 'wallet' | 'settings'>('masks');
  const [isCreatingMask, setIsCreatingMask] = useState(false);

  // New mask form state
  const [newNickname, setNewNickname] = useState('');
  const [newDistrict, setNewDistrict] = useState<RwandanDistrict>('Gasabo');
  const [newColor, setNewColor] = useState('#0D5C63');
  const [newSecondaryColor, setNewSecondaryColor] = useState('#78CDA7');
  const [newShape, setNewShape] = useState<Mask['avatarSeed']['shape']>('island');
  const [newPattern, setNewPattern] = useState<Mask['avatarSeed']['pattern']>('agaseke');

  // Shore profile editing
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(currentUserVerifiedProfile.bio);
  const [editedIntent, setEditedIntent] = useState(currentUserVerifiedProfile.datingIntent);

  const dict = DICTIONARY[language];

  const handleCreateMaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;
    createCustomMask(newNickname.trim(), newDistrict, newColor, newSecondaryColor, newShape, newPattern);
    setIsCreatingMask(false);
    setNewNickname('');
  };

  const handleSaveShoreProfile = () => {
    updateCurrentUserVerifiedProfile({
      bio: editedBio,
      datingIntent: editedIntent,
    });
    setIsEditingBio(false);
  };

  return (
    <div className="flex-1 flex flex-col p-3.5 pb-20 space-y-4">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('masks')}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-xl transition-all ${
            activeSubTab === 'masks'
              ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          My Masks
        </button>
        <button
          onClick={() => setActiveSubTab('shore')}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'shore'
              ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
          <span>Shore ID</span>
        </button>
        <button
          onClick={() => setActiveSubTab('wallet')}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'wallet'
              ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#EE6C4D]" />
          <span>Billing</span>
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-xl transition-all ${
            activeSubTab === 'settings'
              ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Settings
        </button>
      </div>

      {/* 1. MY MASKS TAB */}
      {activeSubTab === 'masks' && (
        <div className="space-y-3.5">
          {/* Active Mask Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-teal-900 to-[#0D5C63] text-white shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#78CDA7]">
              Current Anonymous Persona
            </span>
            <div className="flex items-center gap-3.5">
              <AvatarSvg seed={currentUserMask.avatarSeed} size={54} />
              <div>
                <h3 className="text-base font-extrabold">{currentUserMask.nickname}</h3>
                <p className="text-xs text-teal-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#78CDA7]" />
                  <span>{currentUserMask.district} District</span>
                </p>
                <span className="text-[10px] text-teal-300 font-mono mt-0.5 inline-block">
                  Reputation: {currentUserMask.reputationPoints || 10} pts
                </span>
              </div>
            </div>
          </div>

          {/* Switchable Masks List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Your Saved Masks ({userMasks.length})
              </h4>
              <button
                onClick={() => setIsCreatingMask(!isCreatingMask)}
                className="text-xs font-bold text-[#0D5C63] dark:text-[#78CDA7] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New</span>
              </button>
            </div>

            <div className="space-y-2">
              {userMasks.map((mask) => {
                const isActive = mask.id === currentUserMask.id;
                return (
                  <div
                    key={mask.id}
                    onClick={() => switchUserMask(mask.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 shadow-2xs'
                        : 'bg-white dark:bg-[#0B2124] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <AvatarSvg seed={mask.avatarSeed} size={38} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {mask.nickname}
                          </span>
                          {isActive && (
                            <span className="text-[9px] bg-teal-600 text-white px-1.5 rounded-sm font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{mask.district}</p>
                      </div>
                    </div>

                    <button
                      className={`p-1.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'text-teal-700 dark:text-teal-300'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Mask Form Sheet */}
          {isCreatingMask && (
            <form
              onSubmit={handleCreateMaskSubmit}
              className="p-4 rounded-3xl bg-white dark:bg-[#0B2124] border border-teal-200 dark:border-teal-800/60 shadow-xs space-y-3.5 animate-in fade-in duration-200"
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Craft a New Lagoon Mask</h4>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Mask Nickname</label>
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="e.g. NyabugogoSailor"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0D5C63]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Rwandan District</label>
                <select
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value as RwandanDistrict)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold">Primary Color</label>
                  <div className="flex items-center gap-1.5">
                    {['#0D5C63', '#EE6C4D', '#2A9D8F', '#3A86FF', '#8338EC'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-slate-400' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold">Pattern Style</label>
                  <select
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value as Mask['avatarSeed']['pattern'])}
                    className="w-full py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="agaseke">Agaseke</option>
                    <option value="dots">Dots</option>
                    <option value="lines">Lines</option>
                    <option value="ripple">Ripple</option>
                    <option value="sol">Sol</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!newNickname.trim()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0D5C63] text-white text-xs font-bold disabled:opacity-40"
                >
                  Save & Wear Mask
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingMask(false)}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 2. SHORE VERIFIED PROFILE TAB */}
      {activeSubTab === 'shore' && (
        <div className="space-y-3.5">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-900 to-sky-950 text-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
                Verified Dating Profile
              </span>
              <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Law No 058/2021 Verified</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <AvatarSvg seed={currentUserVerifiedProfile.avatarSeed} size={54} isVerified={true} />
              <div>
                <h3 className="text-base font-extrabold">
                  {currentUserVerifiedProfile.firstName}, {currentUserVerifiedProfile.age}
                </h3>
                <p className="text-xs text-sky-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  <span>{currentUserVerifiedProfile.district} District</span>
                </p>
                <span className="text-[10px] text-sky-300 font-mono mt-0.5 inline-block">
                  Phone: {currentUserVerifiedProfile.phoneNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white">Profile Information</h4>
              <button
                onClick={() => setIsEditingBio(!isEditingBio)}
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
              >
                {isEditingBio ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditingBio ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Dating Intent</label>
                  <select
                    value={editedIntent}
                    onChange={(e) => setEditedIntent(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    <option value="Serious relationship">Serious relationship</option>
                    <option value="Friendship first">Friendship first</option>
                    <option value="Marriage-minded">Marriage-minded</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Bio</label>
                  <textarea
                    rows={3}
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>

                <button
                  onClick={handleSaveShoreProfile}
                  className="w-full py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                >
                  Save Profile Updates
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Dating Intent:</span>
                  <span>{currentUserVerifiedProfile.datingIntent}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Bio:</span>
                  <p>{currentUserVerifiedProfile.bio}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Languages:</span>
                  <span>{currentUserVerifiedProfile.languages.join(', ')}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Interests:</span>
                  <span>{currentUserVerifiedProfile.interests.join(' · ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. WALLET & BILLING (Atoll Plus & Sparks) */}
      {activeSubTab === 'wallet' && (
        <div className="space-y-3.5">
          {/* Atoll Plus Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-sm">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Atoll Plus</span>
              </div>
              <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full">
                {isAtollPlusActive ? 'Active' : 'Free Tier'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Unlock advanced filters (Religion, Education, Height) and see full unblurred profiles of everyone who likes you.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() =>
                  openMoMoModal({
                    title: 'Atoll Plus (1 Month)',
                    amountRwf: 3000,
                    type: 'plus',
                    planDuration: 'month',
                  })
                }
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-2xs"
              >
                3,000 RWF / month
              </button>
              <button
                onClick={() =>
                  openMoMoModal({
                    title: 'Atoll Plus (1 Week)',
                    amountRwf: 1000,
                    type: 'plus',
                    planDuration: 'week',
                  })
                }
                className="py-2 px-3 rounded-xl border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-xs hover:bg-amber-100"
              >
                1,000 RWF / week
              </button>
            </div>
          </div>

          {/* Sparks Airtime Bundles */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-teal-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <Sparkles className="w-4 h-4 text-[#EE6C4D]" />
                <span>Sparks Airtime Wallet</span>
              </div>
              <span className="font-mono font-extrabold text-sm text-[#0D5C63] dark:text-[#78CDA7]">
                {sparksBalance.toLocaleString()} Sparks
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Use Sparks to spotlight Lagoon posts for 24h (500 Sparks) or send bonus Shore intros (200 Sparks).
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { rwf: 500, sparks: 500 },
                { rwf: 1500, sparks: 1600 },
                { rwf: 3000, sparks: 3500 },
              ].map((tier) => (
                <button
                  key={tier.rwf}
                  onClick={() =>
                    openMoMoModal({
                      title: `${tier.sparks} Sparks Bundle`,
                      amountRwf: tier.rwf,
                      type: 'sparks',
                      sparksAmount: tier.sparks,
                    })
                  }
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-center space-y-1 transition-all active:scale-[0.98]"
                >
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                    {tier.sparks}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {tier.rwf} RWF
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SETTINGS TAB */}
      {activeSubTab === 'settings' && (
        <div className="space-y-3">
          {/* Language toggle */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-teal-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Language</h4>
                <p className="text-[10px] text-slate-400">Current: {language === 'en' ? 'English' : 'Ikinyarwanda'}</p>
              </div>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
              className="py-1 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              {language === 'en' ? 'Switch to Kinyarwanda' : 'Hindura Icyongereza'}
            </button>
          </div>

          {/* Dark mode switcher */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dark Theme</h4>
                <p className="text-[10px] text-slate-400">Lagoon midnight mode surfaces</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isDarkMode ? 'bg-[#0D5C63]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Discreet Notification Mode */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-4 h-4 text-[#EE6C4D]" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Discreet Notifications</h4>
                <p className="text-[10px] text-slate-400">Replaces text with &ldquo;New Message Available&rdquo;</p>
              </div>
            </div>
            <button
              onClick={toggleDiscreetMode}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isDiscreetMode ? 'bg-[#EE6C4D]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isDiscreetMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Backstage Moderator Access */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Backstage Moderator View</h4>
              <p className="text-[10px] text-slate-500">Live revenue dashboard & incident queue</p>
            </div>
            <button
              onClick={() => setCurrentTab('moderator')}
              className="py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Moderator</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Demo Controls overlay trigger */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200">Demo Simulator Suite</h4>
              <p className="text-[10px] text-teal-600 dark:text-teal-400">Override ID outcomes, payments, and fast-forward time</p>
            </div>
            <button
              onClick={() => setIsDemoPanelOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-[#0D5C63] text-white text-xs font-bold"
            >
              Open ⚡
            </button>
          </div>

          {/* Reset Demo button */}
          <div className="pt-2">
            <button
              onClick={resetDemoState}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{dict.resetDemo || 'Reset Demo State'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
