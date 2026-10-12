import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AvatarSvg } from '../common/AvatarSvg';
import { ChatConversationView } from './ChatConversationView';
import { DICTIONARY } from '../../data/mock';
import {
  ShieldCheck,
  MessagesSquare,
  Lock,
  ChevronRight,
  EyeOff,
  Phone,
} from 'lucide-react';

export const ChatsListView: React.FC = () => {
  const {
    chats,
    activeChatId,
    setActiveChatId,
    isDiscreetMode,
    language,
  } = useAppStore();

  const [filterType, setFilterType] = useState<'all' | 'lagoon_masked' | 'shore_verified'>('all');

  const dict = DICTIONARY[language];

  if (activeChatId) {
    return <ChatConversationView />;
  }

  const filteredChats = chats.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  return (
    <div className="flex-1 flex flex-col p-3.5 space-y-3 pb-20">
      {/* Header Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            {dict.chats || 'Chats'}
          </h2>
          <p className="text-[11px] text-slate-500">
            {chats.length} active private conversations
          </p>
        </div>

        {/* Discreet Mode Indicator */}
        {isDiscreetMode && (
          <span className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">
            <EyeOff className="w-3 h-3 text-[#EE6C4D]" />
            <span>Discreet Previews</span>
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filterType === 'all'
              ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          All ({chats.length})
        </button>
        <button
          onClick={() => setFilterType('shore_verified')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterType === 'shore_verified'
              ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3 h-3 text-sky-500" />
          <span>Shore</span>
        </button>
        <button
          onClick={() => setFilterType('lagoon_masked')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterType === 'lagoon_masked'
              ? 'bg-white dark:bg-[#0D5C63] text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-3 h-3 text-teal-600" />
          <span>Lagoon</span>
        </button>
      </div>

      {/* Chat Rows */}
      <div className="space-y-2">
        {filteredChats.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <MessagesSquare className="w-6 h-6 mx-auto text-teal-500" />
            <p className="text-xs">No conversations in this section yet.</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isShore = chat.type === 'shore_verified';
            const bothShared = chat.hasUserRequestedNumberShare && chat.hasPartnerRequestedNumberShare;
            const totalMessages = chat.userMessageCount + chat.partnerMessageCount;

            return (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#0B2124] border border-slate-200/90 dark:border-teal-900/40 hover:border-teal-500 text-left flex items-center justify-between gap-3 shadow-2xs transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <AvatarSvg
                      seed={chat.participantAvatarSeed}
                      size={42}
                      isVerified={isShore}
                    />
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#EE6C4D] text-white text-[9px] font-bold flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {chat.participantName}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          isShore
                            ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                            : 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                        }`}
                      >
                        {isShore ? 'Shore' : 'Mask'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {isDiscreetMode
                        ? 'New Message Available'
                        : chat.lastMessageSnippet}
                    </p>

                    {/* Escrow badge for Shore */}
                    {isShore && (
                      <div className="flex items-center gap-1.5 text-[10px] mt-1 text-slate-400">
                        {bothShared ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>Contact Exchanged</span>
                          </span>
                        ) : (
                          <span>
                            Escrow: {Math.min(totalMessages, 10)}/10 msgs · {chat.createdAtDaysAgo}/2 days
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  <span className="text-[10px]">{chat.lastMessageTime}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
