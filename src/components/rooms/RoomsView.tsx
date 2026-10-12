import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RoomChatView } from './RoomChatView';
import { DICTIONARY } from '../../data/mock';
import {
  Users,
  Flame,
  Briefcase,
  HeartCrack,
  Music,
  Trophy,
  Utensils,
  Sparkles,
  Compass,
  ChevronRight,
  ShieldAlert,
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

export const RoomsView: React.FC = () => {
  const { rooms, activeRoomId, setActiveRoomId, language } = useAppStore();
  const dict = DICTIONARY[language];

  // Subtle live membership fluctuation
  const [membershipDeltas, setMembershipDeltas] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
      const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
      setMembershipDeltas((prev) => ({
        ...prev,
        [randomRoom.id]: (prev[randomRoom.id] || 0) + delta,
      }));
    }, 4000);

    return () => clearInterval(timer);
  }, [rooms]);

  if (activeRoomId) {
    return <RoomChatView />;
  }

  return (
    <div className="flex-1 flex flex-col p-3.5 space-y-3 pb-20">
      {/* Rooms intro banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-900 to-[#0D5C63] text-white shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#78CDA7]">
            Anonymous Mask Channels
          </span>
          <span className="text-[10px] font-mono text-teal-200 bg-teal-800/80 px-2 py-0.5 rounded-full">
            8 Active Channels
          </span>
        </div>
        <h3 className="text-base font-extrabold tracking-tight">Kigali Community Rooms</h3>
        <p className="text-[11px] text-teal-100/90 leading-relaxed">
          Real-time conversations with fluctuating live presence. No real names or phone numbers allowed.
        </p>
      </div>

      {/* Room List Grid */}
      <div className="space-y-2">
        {rooms.map((room) => {
          const IconComponent = ICON_MAP[room.iconName] || Briefcase;
          const delta = membershipDeltas[room.id] || 0;
          const currentCount = Math.max(12, room.activeMembers + delta);

          return (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all hover:border-teal-500 active:scale-[0.99] ${
                room.isBuzz
                  ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                  : 'bg-white dark:bg-[#0B2124] border-slate-200 dark:border-teal-900/40 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    room.isBuzz
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-[#0D5C63] dark:text-[#78CDA7]'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {language === 'rw' ? room.kinyaName : room.name}
                    </h4>
                    {room.isBuzz && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        <span>Hot</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                    {language === 'rw' ? room.kinyaDescription : room.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  <Users className="w-3 h-3 text-teal-600" />
                  <span className="tabular-nums">{currentCount}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety notice pinned at bottom */}
      <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0" />
        <span>
          Rooms are strictly anonymous. Contact details can only be revealed in The Shore dating space after verification.
        </span>
      </div>
    </div>
  );
};
