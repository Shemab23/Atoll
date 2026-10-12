import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DICTIONARY } from '../../data/mock';
import { Waves, MessageSquare, MessagesSquare, HeartHandshake, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, language, chats } = useAppStore();
  const dict = DICTIONARY[language];

  // Calculate unread chats
  const unreadChats = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const tabs = [
    { id: 'lagoon' as const, label: dict.lagoon || 'Lagoon', icon: Waves },
    { id: 'rooms' as const, label: dict.rooms || 'Rooms', icon: MessageSquare },
    { id: 'chats' as const, label: dict.chats || 'Chats', icon: MessagesSquare, badge: unreadChats },
    { id: 'shore' as const, label: dict.shore || 'Shore', icon: HeartHandshake, isShore: true },
    { id: 'me' as const, label: dict.me || 'Me', icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-30 w-full bg-white/95 dark:bg-[#081C1E]/95 backdrop-blur-md border-t border-slate-200 dark:border-teal-900/30 px-2 py-1.5 transition-colors">
      <div className="grid grid-cols-5 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`min-h-[46px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? tab.isShore
                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-[#0D5C63] dark:text-[#78CDA7] font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-[#EE6C4D] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {tab.badge}
                  </span>
                ) : null}
                {tab.isShore && !isActive && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-sky-500" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
