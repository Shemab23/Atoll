import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AvatarSvg } from '../common/AvatarSvg';
import { DICTIONARY } from '../../data/mock';
import {
  ArrowLeft,
  Send,
  ShieldAlert,
  Users,
  Flame,
  Briefcase,
  HeartCrack,
  Music,
  Trophy,
  Utensils,
  Sparkles,
  Compass,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  HeartCrack,
  Music,
  Trophy,
  Utensils,
  Sparkles,
  Compass,
  Flame,
};

export const RoomChatView: React.FC = () => {
  const {
    activeRoomId,
    setActiveRoomId,
    rooms,
    roomMessages,
    sendRoomMessage,
    appendSimulatedRoomMessage,
    currentUserMask,
    language,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = rooms.find((r) => r.id === activeRoomId);

  // Live simulator: Append simulated messages from seeded masks every 4.5 seconds
  useEffect(() => {
    if (!activeRoomId) return;

    const interval = setInterval(() => {
      appendSimulatedRoomMessage(activeRoomId);
    }, 4500);

    return () => clearInterval(interval);
  }, [activeRoomId, appendSimulatedRoomMessage]);

  // Auto-scroll to bottom on new messages
  const messages = (activeRoomId && roomMessages[activeRoomId]) || [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!room) return null;

  const IconComponent = ICON_MAP[room.iconName] || MessageSquareFallback;
  const dict = DICTIONARY[language];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const sent = sendRoomMessage(room.id, inputText.trim());
    if (sent) {
      setInputText('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-105px)] bg-slate-50/50 dark:bg-[#07181A]">
      {/* Room Header */}
      <div className="px-3.5 py-2.5 bg-white dark:bg-[#081C1E] border-b border-slate-200 dark:border-teal-900/30 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setActiveRoomId(null)}
            className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-[#0D5C63] dark:text-[#78CDA7] flex items-center justify-center shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {language === 'rw' ? room.kinyaName : room.name}
            </h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-teal-600" />
              <span>{room.activeMembers} {dict.online || 'online'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-teal-800 dark:text-teal-300 font-mono bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Feed</span>
        </div>
      </div>

      {/* Pinned Buzz Guardrail Notice (if Buzz room) */}
      {room.isBuzz && (
        <div className="m-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="font-bold">Buzz Room Guardrail:</strong> {dict.buzzNotice}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No messages yet. Jump into the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderMask.id === currentUserMask.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 max-w-[88%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {!isMe && <AvatarSvg seed={msg.senderMask.avatarSeed} size={30} />}

                <div
                  className={`p-2.5 rounded-2xl text-xs space-y-0.5 shadow-2xs ${
                    isMe
                      ? 'bg-[#0D5C63] text-white rounded-tr-xs'
                      : 'bg-white dark:bg-[#0B2124] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-teal-900/40 rounded-tl-xs'
                  }`}
                >
                  {!isMe && (
                    <div className="flex items-center justify-between gap-3 text-[10px] text-[#0D5C63] dark:text-[#78CDA7] font-bold">
                      <span>{msg.senderMask.nickname}</span>
                      <span className="text-slate-400 font-normal">{msg.timestamp}</span>
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {isMe && (
                    <div className="text-[9px] text-teal-200 text-right opacity-80">{msg.timestamp}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-white dark:bg-[#081C1E] border-t border-slate-200 dark:border-teal-900/30 flex items-center gap-2"
      >
        <AvatarSvg seed={currentUserMask.avatarSeed} size={30} />
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${language === 'rw' ? room.kinyaName : room.name} as ${currentUserMask.nickname}...`}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0D5C63]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-[#0D5C63] hover:bg-[#0a484e] disabled:opacity-40 text-white transition-all shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

const MessageSquareFallback: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
