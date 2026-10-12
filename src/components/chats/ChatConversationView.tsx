import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AvatarSvg } from '../common/AvatarSvg';
import { DICTIONARY } from '../../data/mock';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  ShieldAlert,
  Phone,
  AlertTriangle,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';

export const ChatConversationView: React.FC = () => {
  const {
    activeChatId,
    setActiveChatId,
    chats,
    sendChatMessage,
    requestNumberShare,
    currentUserMask,
    currentUserVerifiedProfile,
    language,
    fastForwardTime,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = chats.find((c) => c.id === activeChatId);
  const dict = DICTIONARY[language];

  const messages = chat?.messages || [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!chat) return null;

  const isShore = chat.type === 'shore_verified';
  const totalMessages = chat.userMessageCount + chat.partnerMessageCount;
  const daysPassed = chat.createdAtDaysAgo;

  // Progressive Escrow Criteria
  const escrowMessagesRequired = 10;
  const escrowDaysRequired = 2;
  const escrowMet = totalMessages >= escrowMessagesRequired && daysPassed >= escrowDaysRequired;

  const bothSharedNumbers = chat.hasUserRequestedNumberShare && chat.hasPartnerRequestedNumberShare;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const result = sendChatMessage(chat.id, inputText.trim());
    if (result.sent) {
      setInputText('');
    }
  };

  const handleConfirmNumberShare = () => {
    requestNumberShare(chat.id);
    setShowSafetyModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-105px)] bg-slate-50/50 dark:bg-[#07181A]">
      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-white dark:bg-[#081C1E] border-b border-slate-200 dark:border-teal-900/30 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setActiveChatId(null)}
            className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <AvatarSvg
            seed={chat.participantAvatarSeed}
            size={34}
            isVerified={isShore}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {chat.participantName}
              </h3>
              {isShore && (
                <span className="text-[9px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-1 rounded-sm font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {chat.participantDistrict} · {isShore ? 'Shore Dating' : 'Lagoon Mask DM'}
            </p>
          </div>
        </div>

        {/* Mode Tag */}
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isShore
              ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
          }`}
        >
          {isShore ? 'Verified DM' : 'Mask DM'}
        </span>
      </div>

      {/* Progressive Escrow Meter (Gate 1 & Gate 3) */}
      {isShore && (
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border-b border-sky-200/50 dark:border-sky-800/40 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-sky-950 dark:text-sky-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>{dict.escrowNotice}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {Math.min(totalMessages, escrowMessagesRequired)}/{escrowMessagesRequired} {dict.messagesCount} · {Math.min(daysPassed, escrowDaysRequired)}/{escrowDaysRequired} {dict.daysPassed}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-sky-100 dark:bg-sky-950 rounded-full overflow-hidden flex">
            <div
              className="bg-sky-600 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, ((totalMessages / escrowMessagesRequired) * 0.5 + (daysPassed / escrowDaysRequired) * 0.5) * 100)}%`,
              }}
            />
          </div>

          {/* Escrow unlock or CTA */}
          {escrowMet ? (
            <div className="pt-1 flex items-center justify-between gap-2">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Criteria met! Mutual contact exchange unlocked.</span>
              </span>

              <button
                onClick={() => {
                  if (chat.hasUserRequestedNumberShare) {
                    requestNumberShare(chat.id);
                  } else {
                    setShowSafetyModal(true);
                  }
                }}
                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 ${
                  bothSharedNumbers
                    ? 'bg-emerald-600 text-white'
                    : chat.hasUserRequestedNumberShare
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                <Phone className="w-2.5 h-2.5" />
                <span>
                  {bothSharedNumbers
                    ? 'Number Shared'
                    : chat.hasUserRequestedNumberShare
                    ? 'Waiting Partner'
                    : 'Share My Number'}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span>Contact details locked until 10 messages & 2 days pass.</span>
              <button
                onClick={fastForwardTime}
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5"
                title="Fast forward via Demo Controls"
              >
                <span>Fast-Forward ⚡</span>
              </button>
            </div>
          )}

          {/* Number Revealed Card if both shared */}
          {bothSharedNumbers && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                  Mutual Verification Verified
                </span>
                <span className="font-mono font-bold">{chat.partnerPhoneNumber}</span>
              </div>
              <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Unlocked
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mask Mode Strict Isolation Notice */}
      {!isShore && (
        <div className="px-3.5 py-1.5 bg-teal-50/70 dark:bg-teal-950/40 border-b border-teal-200/50 dark:border-teal-900/30 text-[10px] text-teal-900 dark:text-teal-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-teal-600" />
            <span>Anonymous Lagoon mode: Real names and contacts cannot be shared.</span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 text-center leading-relaxed"
              >
                {msg.text}
              </div>
            );
          }

          const isMe = msg.senderId === 'current-user';

          return (
            <div key={msg.id} className="space-y-1">
              {/* Monetary Request Warning Banner (Injected into chat bubble space) */}
              {msg.hasMoneyWarning && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>⚠️ Financial Safety Warning:</strong> Message mentions sending MoMo or cash.
                    Never send money to someone you have not met safely in public in Kigali.
                  </p>
                </div>
              )}

              {/* Chat Bubble */}
              <div
                className={`flex items-start gap-2 max-w-[85%] ${
                  isMe ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {!isMe && (
                  <AvatarSvg
                    seed={chat.participantAvatarSeed}
                    size={28}
                    isVerified={isShore}
                  />
                )}

                <div
                  className={`p-3 rounded-2xl text-xs space-y-0.5 shadow-2xs ${
                    isMe
                      ? isShore
                        ? 'bg-sky-600 text-white rounded-tr-xs'
                        : 'bg-[#0D5C63] text-white rounded-tr-xs'
                      : 'bg-white dark:bg-[#0B2124] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-teal-900/40 rounded-tl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`text-[9px] text-right opacity-70 ${
                      isMe ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Bar */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-white dark:bg-[#081C1E] border-t border-slate-200 dark:border-teal-900/30 flex items-center gap-2"
      >
        <AvatarSvg
          seed={isShore ? currentUserVerifiedProfile.avatarSeed : currentUserMask.avatarSeed}
          size={30}
          isVerified={isShore}
        />
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${chat.participantName}...`}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0D5C63]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2.5 rounded-xl disabled:opacity-40 text-white transition-all shadow-xs ${
            isShore ? 'bg-sky-600 hover:bg-sky-700' : 'bg-[#0D5C63] hover:bg-[#0a484e]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Safety Confirmation Modal for Gate 3 Contact Reveal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-white dark:bg-[#081C1E] rounded-3xl border border-slate-200 dark:border-teal-800/40 p-5 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 mx-auto flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Share Phone Number?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You have reached 10 messages and 2 days. Sharing will disclose your verified number (
                <strong className="text-slate-800 dark:text-slate-200">
                  {currentUserVerifiedProfile.phoneNumber}
                </strong>
                ) to {chat.participantName} once they reciprocate.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-600" />
                <span>Safety Best Practices:</span>
              </div>
              <p className="opacity-90">
                Meet in open public areas (coffee shops, public parks) for your first in-person conversation.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmNumberShare}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
              >
                Yes, Share My Number
              </button>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
