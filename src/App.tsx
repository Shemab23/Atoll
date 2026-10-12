import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { TopHeader } from './components/common/TopHeader';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { DemoControlPanel } from './components/common/DemoControlPanel';
import { MoMoPaymentModal } from './components/common/MoMoPaymentModal';
import { LagoonView } from './components/lagoon/LagoonView';
import { RoomsView } from './components/rooms/RoomsView';
import { ChatsListView } from './components/chats/ChatsListView';
import { ShoreView } from './components/shore/ShoreView';
import { ProfileView } from './components/me/ProfileView';
import { ModeratorView } from './components/moderator/ModeratorView';

export default function App() {
  const { currentTab, isDarkMode } = useAppStore();

  // Sync dark class on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-[#F0F5F5] dark:bg-[#030E10] flex justify-center items-stretch relative overflow-x-hidden selection:bg-[#78CDA7]/30">
      {/* Desktop Background Ambience Canvas (Subtle topographical ripples & islands) */}
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 hidden md:block overflow-hidden z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <radialGradient id="bg-glow" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#78CDA7" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#0D5C63" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-glow)" />
          {/* Subtle contour lines */}
          <path
            d="M 0,200 C 300,150 600,280 900,220 C 1200,160 1500,250 1800,210"
            fill="none"
            stroke="#0D5C63"
            strokeWidth="1"
            strokeOpacity="0.1"
          />
          <path
            d="M 0,450 C 400,400 700,520 1100,460 C 1400,420 1700,500 2000,470"
            fill="none"
            stroke="#0D5C63"
            strokeWidth="1"
            strokeOpacity="0.08"
          />
          <path
            d="M 0,700 C 350,650 750,780 1200,720 C 1500,680 1800,760 2100,730"
            fill="none"
            stroke="#0D5C63"
            strokeWidth="1"
            strokeOpacity="0.06"
          />
        </svg>
      </div>

      {/* Centered Mobile Device Frame (Restricted to max-width 430px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-white dark:bg-[#081C1E] shadow-2xl relative flex flex-col border-x border-slate-200/80 dark:border-teal-900/30 z-10 transition-colors">
        {/* Top Header */}
        <TopHeader />

        {/* Dynamic View Space */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {currentTab === 'lagoon' && <LagoonView />}
          {currentTab === 'rooms' && <RoomsView />}
          {currentTab === 'chats' && <ChatsListView />}
          {currentTab === 'shore' && <ShoreView />}
          {currentTab === 'me' && <ProfileView />}
          {currentTab === 'moderator' && <ModeratorView />}
        </main>

        {/* Bottom Tab Navigation */}
        <BottomNav />

        {/* Global Overlays */}
        <ToastContainer />
        <DemoControlPanel />
        <MoMoPaymentModal />
      </div>
    </div>
  );
}
