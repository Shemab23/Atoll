import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Language,
  Mask,
  LagoonCategory,
  LagoonPost,
  PromptType,
  TopicRoom,
  RoomMessage,
  DirectChat,
  ChatMessage,
  VerificationStatus,
  VerifiedProfile,
  DemoIdOutcome,
  DemoPaymentOutcome,
  SystemLogEntry,
  IncidentReport,
  RwandanDistrict,
} from '../types';
import {
  SEEDED_MASKS,
  SEEDED_POSTS,
  SEEDED_ROOMS,
  SEEDED_ROOM_MESSAGES,
  SEEDED_CHATS,
  SEEDED_SHORE_PROFILES,
  SEEDED_SYSTEM_LOGS,
  SEEDED_INCIDENTS,
} from '../data/mock';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface MoMoPaymentContext {
  title: string;
  amountRwf: number;
  type: 'plus' | 'sparks';
  sparksAmount?: number;
  planDuration?: 'week' | 'month';
}

interface AppState {
  // Localization & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isDiscreetMode: boolean;
  toggleDiscreetMode: () => void;

  // Navigation
  currentTab: 'lagoon' | 'rooms' | 'chats' | 'shore' | 'me' | 'moderator';
  setCurrentTab: (tab: 'lagoon' | 'rooms' | 'chats' | 'shore' | 'me' | 'moderator') => void;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  activePostId: string | null;
  setActivePostId: (id: string | null) => void;
  isPostComposerOpen: boolean;
  setIsPostComposerOpen: (open: boolean) => void;
  isDemoPanelOpen: boolean;
  setIsDemoPanelOpen: (open: boolean) => void;

  // MoMo Payment Sheet
  isMoMoModalOpen: boolean;
  momoPaymentContext: MoMoPaymentContext | null;
  openMoMoModal: (context: MoMoPaymentContext) => void;
  closeMoMoModal: () => void;

  // Mask Management
  currentUserMask: Mask;
  userMasks: Mask[];
  switchUserMask: (maskId: string) => void;
  createCustomMask: (
    nickname: string,
    district: RwandanDistrict,
    color: string,
    secondaryColor: string,
    shape: Mask['avatarSeed']['shape'],
    pattern: Mask['avatarSeed']['pattern']
  ) => void;

  // Lagoon Space
  posts: LagoonPost[];
  categoryFilter: LagoonCategory;
  setCategoryFilter: (cat: LagoonCategory) => void;
  addPost: (prompt: PromptType, content: string, category: Exclude<LagoonCategory, 'All' | 'My District'>, isDistrictOnly: boolean) => void;
  likePost: (postId: string) => void;
  addReply: (postId: string, content: string) => void;
  boostPost: (postId: string) => boolean;
  hidePost: (postId: string) => void;

  // Topic Rooms Space
  rooms: TopicRoom[];
  roomMessages: Record<string, RoomMessage[]>;
  sendRoomMessage: (roomId: string, text: string) => boolean;
  appendSimulatedRoomMessage: (roomId: string) => void;

  // Direct Chats Space
  chats: DirectChat[];
  sendChatMessage: (chatId: string, text: string) => { sent: boolean; reason?: string; warning?: boolean };
  requestNumberShare: (chatId: string) => void;
  startOrOpenChatWithMask: (targetMask: Mask) => string;

  // Shore Verified Dating
  verificationStatus: VerificationStatus;
  setVerificationStatus: (status: VerificationStatus) => void;
  currentUserVerifiedProfile: VerifiedProfile;
  updateCurrentUserVerifiedProfile: (updates: Partial<VerifiedProfile>) => void;
  shoreProfiles: VerifiedProfile[];
  dailyIntrosRemaining: number;
  discoveryLayout: 'deck' | 'grid';
  setDiscoveryLayout: (layout: 'deck' | 'grid') => void;
  sendShoreIntro: (profileId: string, introMessage: string) => boolean;
  likeShoreProfile: (profileId: string) => void;

  // Monetization
  isAtollPlusActive: boolean;
  atollPlusExpiry: string | null;
  sparksBalance: number;
  addSparks: (amount: number) => void;
  activateAtollPlusSubscription: (plan: 'week' | 'month') => void;

  // Safety & Logs & Incidents
  systemLogs: SystemLogEntry[];
  addSystemLog: (eventType: string, details: string, level: SystemLogEntry['level']) => void;
  incidentReports: IncidentReport[];
  updateIncidentStatus: (id: string, status: IncidentReport['status']) => void;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Demo Control Suite
  demoIdOutcome: DemoIdOutcome;
  setDemoIdOutcome: (outcome: DemoIdOutcome) => void;
  demoPaymentOutcome: DemoPaymentOutcome;
  setDemoPaymentOutcome: (outcome: DemoPaymentOutcome) => void;
  fastForwardTime: () => void;
  resetDemoState: () => void;
}

const INITIAL_USER_MASKS: Mask[] = [
  SEEDED_MASKS[0],
  {
    id: 'mask-user-alt1',
    nickname: 'KigaliNightRider',
    district: 'Kicukiro',
    avatarSeed: { color: '#3A86FF', secondaryColor: '#FF006E', shape: 'polygon', pattern: 'ripple' },
    reputationPoints: 45,
    isCurrentUser: true,
  },
  {
    id: 'mask-user-alt2',
    nickname: 'SilentVirunga',
    district: 'Musanze',
    avatarSeed: { color: '#2A9D8F', secondaryColor: '#E76F51', shape: 'wave', pattern: 'lines' },
    reputationPoints: 90,
    isCurrentUser: true,
  },
];

const INITIAL_CURRENT_USER_VERIFIED: VerifiedProfile = {
  id: 'current-user-verified',
  firstName: 'Christian',
  age: 28,
  district: 'Gasabo',
  datingIntent: 'Serious relationship',
  languages: ['Kinyarwanda', 'English', 'French'],
  bio: 'Digital product specialist in Kigali. Passionate about urban mobility, acoustic music, and peaceful Sunday hill walks.',
  interests: ['Design', 'Acoustic Guitar', 'Cycling'],
  avatarSeed: { color: '#0D5C63', secondaryColor: '#78CDA7', shape: 'island', pattern: 'agaseke' },
  isVerified: true,
  phoneNumber: '+250 782 550 192',
  heightCm: 180,
  education: 'BSc Information Systems',
  religion: 'Christian',
};

// Regex patterns for safety checking
const PHONE_REGEX = /(\+?250|07[2389])[0-9\s-]{7,10}|(\d{3}[\s.-]?\d{3}[\s.-]?\d{3})/i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|rw|net|io|me))/i;
const MONEY_REGEX = /(send\s+money|momo|rwf|amashilingi|amafaranga|transfer\s+me|send\s+\d+|cash\s+out)/i;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Localization & Theme
      language: 'en',
      setLanguage: (language) => set({ language }),
      isDarkMode: false,
      toggleDarkMode: () => {
        const next = !get().isDarkMode;
        set({ isDarkMode: next });
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      isDiscreetMode: false,
      toggleDiscreetMode: () => set((state) => ({ isDiscreetMode: !state.isDiscreetMode })),

      // Navigation
      currentTab: 'lagoon',
      setCurrentTab: (currentTab) => set({ currentTab, activeRoomId: null, activeChatId: null, activePostId: null }),
      activeRoomId: null,
      setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
      activeChatId: null,
      setActiveChatId: (activeChatId) => set({ activeChatId }),
      activePostId: null,
      setActivePostId: (activePostId) => set({ activePostId }),
      isPostComposerOpen: false,
      setIsPostComposerOpen: (isPostComposerOpen) => set({ isPostComposerOpen }),
      isDemoPanelOpen: false,
      setIsDemoPanelOpen: (isDemoPanelOpen) => set({ isDemoPanelOpen }),

      // MoMo Payment Sheet
      isMoMoModalOpen: false,
      momoPaymentContext: null,
      openMoMoModal: (momoPaymentContext) => set({ isMoMoModalOpen: true, momoPaymentContext }),
      closeMoMoModal: () => set({ isMoMoModalOpen: false, momoPaymentContext: null }),

      // Mask Management
      currentUserMask: INITIAL_USER_MASKS[0],
      userMasks: INITIAL_USER_MASKS,
      switchUserMask: (maskId) => {
        const found = get().userMasks.find((m) => m.id === maskId);
        if (found) {
          set({ currentUserMask: found });
          get().addSystemLog(
            'mask_switched',
            `User switched identity mask to "${found.nickname}" (${found.district}).`,
            'info'
          );
        }
      },
      createCustomMask: (nickname, district, color, secondaryColor, shape, pattern) => {
        const newMask: Mask = {
          id: `mask-custom-${Date.now()}`,
          nickname,
          district,
          avatarSeed: { color, secondaryColor, shape, pattern },
          reputationPoints: 10,
          isCurrentUser: true,
        };
        set((state) => ({
          userMasks: [...state.userMasks, newMask],
          currentUserMask: newMask,
        }));
        get().addSystemLog('mask_created', `New mask created: "${nickname}" (${district}).`, 'info');
        get().addToast('Mask Created', `Switched to "${nickname}".`, 'success');
      },

      // Lagoon Space
      posts: SEEDED_POSTS,
      categoryFilter: 'All',
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      addPost: (prompt, content, category, isDistrictOnly) => {
        // Regex check in Lagoon
        if (PHONE_REGEX.test(content) || EMAIL_REGEX.test(content) || URL_REGEX.test(content)) {
          get().addSystemLog(
            'message_blocked: contact_info_in_lagoon',
            `Post creation blocked: contact info detected in anonymous Lagoon post.`,
            'security'
          );
          get().addToast(
            'Safety Policy Block',
            'For your safety, contact details can only be shared in Shore after both users are verified.',
            'error'
          );
          return;
        }

        const newPost: LagoonPost = {
          id: `post-${Date.now()}`,
          prompt,
          content,
          category,
          district: get().currentUserMask.district,
          isDistrictOnly,
          authorMask: get().currentUserMask,
          createdAt: 'Just now',
          likes: 1,
          replies: [],
        };
        set((state) => ({
          posts: [newPost, ...state.posts],
          isPostComposerOpen: false,
        }));
        get().addSystemLog(
          'lagoon_post_published',
          `New post by "${newPost.authorMask.nickname}" under category ${category}.`,
          'info'
        );
        get().addToast('Post Published', 'Your anonymous thought is now in the Lagoon.', 'success');
      },
      likePost: (postId) => {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)),
        }));
      },
      addReply: (postId, content) => {
        if (PHONE_REGEX.test(content) || EMAIL_REGEX.test(content) || URL_REGEX.test(content)) {
          get().addSystemLog(
            'reply_blocked: contact_info_detected',
            `Lagoon reply blocked: phone/link pattern detected.`,
            'security'
          );
          get().addToast(
            'Safety Policy Block',
            'For your safety, contact details can only be shared in Shore after both users are verified.',
            'error'
          );
          return;
        }

        const newReply = {
          id: `rep-${Date.now()}`,
          postId,
          authorMask: get().currentUserMask,
          content,
          createdAt: 'Just now',
          likes: 0,
        };
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p
          ),
        }));
        get().addSystemLog(
          'lagoon_reply_added',
          `Reply added to post ${postId} by "${get().currentUserMask.nickname}".`,
          'info'
        );
      },
      boostPost: (postId) => {
        const { sparksBalance } = get();
        if (sparksBalance < 500) {
          get().addToast('Insufficient Sparks', 'Post boost requires 500 Sparks. Top up your balance.', 'warning');
          return false;
        }
        set((state) => ({
          sparksBalance: state.sparksBalance - 500,
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isBoosted: true } : p)),
        }));
        get().addSystemLog(
          'sparks_spent: post_boost',
          `500 Sparks spent to spotlight post ${postId} for 24h.`,
          'financial'
        );
        get().addToast('Post Spotlighted!', 'Your post will remain boosted in the Lagoon for 24 hours.', 'success');
        return true;
      },
      hidePost: (postId) => {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isHidden: true } : p)),
        }));
        get().addSystemLog(
          'moderator_action: post_hidden',
          `Post ${postId} was removed from the active Lagoon feed.`,
          'warning'
        );
        get().addToast('Post Hidden', 'Content hidden from community view.', 'info');
      },

      // Topic Rooms Space
      rooms: SEEDED_ROOMS,
      roomMessages: SEEDED_ROOM_MESSAGES,
      sendRoomMessage: (roomId, text) => {
        // Regex checks
        if (PHONE_REGEX.test(text) || EMAIL_REGEX.test(text) || URL_REGEX.test(text)) {
          get().addSystemLog(
            'message_blocked: contact_info_in_room',
            `Room message blocked in ${roomId}: contact info prohibited.`,
            'security'
          );
          get().addToast(
            'Safety Policy Block',
            'For your safety, contact details can only be shared in Shore after both users are verified.',
            'error'
          );
          return false;
        }

        const newMsg: RoomMessage = {
          id: `rm-${Date.now()}`,
          roomId,
          senderMask: get().currentUserMask,
          text,
          timestamp: 'Just now',
        };

        set((state) => ({
          roomMessages: {
            ...state.roomMessages,
            [roomId]: [...(state.roomMessages[roomId] || []), newMsg],
          },
        }));

        get().addSystemLog(
          'room_message_sent',
          `Message sent to ${roomId} by "${get().currentUserMask.nickname}".`,
          'info'
        );
        return true;
      },
      appendSimulatedRoomMessage: (roomId) => {
        const simulatedPool: Record<string, string[]> = {
          'room-work': [
            'Pro tip: set clear boundaries on Slack after 7 PM.',
            'Has anyone used the new talent tax incentives in Kigali?',
            'Coffee breaks around 3 PM are mandatory for brain survival haha.',
          ],
          'room-healing': [
            'Healing is non-linear. Give yourself immense patience today.',
            'Listening to slow inanga music while walking really clears the heart.',
            'Time plus honesty with yourself heals everything.',
          ],
          'room-buzz': [
            'Someone just rented out that whole glass pavilion for a private surprise proposal!',
            'The new underground vinyl record cafe is finally opening next month.',
            'No names, but the drama in the Kigali padel tennis tournament was cinema 😂',
          ],
          'room-football': [
            'If APR drops points this Sunday, the title race is wide open!',
            'Rayon Sports midfield looked so sharp in training yesterday.',
            'Champions League nights this week are going to keep us up late.',
          ],
          'room-music': [
            'Stream that new collaboration with Ish Kevin & Bwiza!',
            'Gakondo guitar rhythms are timeless, love seeing youth modernize it.',
            'Who has tickets to the upcoming festival at BK Arena?',
          ],
          'room-cooking': [
            'Fry ripe plantains with a pinch of sea salt and cinnamon—trust me.',
            'Where do you buy the freshest passion fruits in Gasabo?',
            '15-minute peanut stew over sweet potatoes is my ultimate comfort meal.',
          ],
          'room-faith': [
            'Be kind to people today, you never know what battle they are fighting quietly.',
            'Peace is when prayer turns into trusting.',
            'Wishing everyone a calm and blessed week ahead.',
          ],
          'room-new-in-kigali': [
            'Welcome! Don’t hesitate to explore Umuganda Saturdays to meet neighbors.',
            'Download the Tap&Go card early if you plan to use city buses.',
            'Motos are fast, but walking the clean paved hills in the evening is unmatched.',
          ],
        };

        const list = simulatedPool[roomId] || simulatedPool['room-work'];
        const randomText = list[Math.floor(Math.random() * list.length)];
        const randomMask = SEEDED_MASKS[Math.floor(Math.random() * (SEEDED_MASKS.length - 2)) + 1];

        const simMsg: RoomMessage = {
          id: `rm-sim-${Date.now()}`,
          roomId,
          senderMask: randomMask,
          text: randomText,
          timestamp: 'Just now',
        };

        set((state) => ({
          roomMessages: {
            ...state.roomMessages,
            [roomId]: [...(state.roomMessages[roomId] || []), simMsg],
          },
        }));
      },

      // Direct Chats Space
      chats: SEEDED_CHATS,
      sendChatMessage: (chatId, text) => {
        const chat = get().chats.find((c) => c.id === chatId);
        if (!chat) return { sent: false, reason: 'Chat not found' };

        const hasPhoneOrLink = PHONE_REGEX.test(text) || EMAIL_REGEX.test(text) || URL_REGEX.test(text);
        const hasMoney = MONEY_REGEX.test(text);

        // Rule 1: Mask Mode: Block phone/links completely
        if (chat.type === 'lagoon_masked' && hasPhoneOrLink) {
          get().addSystemLog(
            'message_blocked: contact_exchange_in_lagoon_chat',
            `Message in masked DM blocked: contact exchange disallowed in Lagoon.`,
            'security'
          );
          get().addToast(
            'Safety Policy Block',
            'For your safety, contact details can only be shared in Shore after both users are verified.',
            'error'
          );
          return { sent: false, reason: 'Contact details blocked in Lagoon masked mode.' };
        }

        // Rule 2: Shore Mode: Gate 2 check (10 messages and 2 days)
        const escrowMet = (chat.userMessageCount + chat.partnerMessageCount >= 10) && chat.createdAtDaysAgo >= 2;
        if (chat.type === 'shore_verified' && hasPhoneOrLink && !escrowMet) {
          get().addSystemLog(
            'message_blocked: escrow_gate_unfulfilled',
            `Phone/email blocked in Shore chat: Progressive Escrow requires 10 messages and 2 days.`,
            'security'
          );
          get().addToast(
            'Escrow Rule Enforced',
            'Cannot share direct phone or links yet. Please converse for at least 2 days and exchange 10 messages first.',
            'warning'
          );
          return { sent: false, reason: 'Progressive escrow criteria not yet met.' };
        }

        if (hasMoney) {
          get().addSystemLog(
            'security_warning: money_keywords_detected',
            `Monetary request keyword detected in chat ${chatId}. Warning banner triggered.`,
            'warning'
          );
        }

        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: 'current-user',
          senderName: 'Me',
          text,
          timestamp: 'Just now',
          hasMoneyWarning: hasMoney,
        };

        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, newMsg],
                  userMessageCount: c.userMessageCount + 1,
                  lastMessageSnippet: text,
                  lastMessageTime: 'Just now',
                }
              : c
          ),
        }));

        return { sent: true, warning: hasMoney };
      },
      requestNumberShare: (chatId) => {
        const chat = get().chats.find((c) => c.id === chatId);
        if (!chat) return;

        const nextUserStatus = !chat.hasUserRequestedNumberShare;
        const partnerConsented = chat.hasPartnerRequestedNumberShare || nextUserStatus; // simulate partner reciprocates if criteria met

        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  hasUserRequestedNumberShare: nextUserStatus,
                  hasPartnerRequestedNumberShare: partnerConsented,
                }
              : c
          ),
        }));

        if (nextUserStatus && partnerConsented) {
          get().addSystemLog(
            'contact_exchange: mutual consent recorded',
            `Mutual phone number exchange authorized safely for chat ${chat.participantName}.`,
            'security'
          );
          get().addToast(
            'Contact Revealed Safely',
            `Both parties authorized contact exchange. Phone number is now visible!`,
            'success'
          );
        } else {
          get().addSystemLog(
            'contact_exchange: user_consent_saved',
            `User authorized number exchange. Waiting for partner mutual consent.`,
            'info'
          );
          get().addToast('Consent Saved', 'Awaiting partner to also tap Share My Number.', 'info');
        }
      },
      startOrOpenChatWithMask: (targetMask) => {
        const existing = get().chats.find((c) => c.participantId === targetMask.id);
        if (existing) {
          set({ currentTab: 'chats', activeChatId: existing.id });
          return existing.id;
        }

        const newChat: DirectChat = {
          id: `chat-dm-${Date.now()}`,
          type: 'lagoon_masked',
          participantId: targetMask.id,
          participantName: targetMask.nickname,
          participantDistrict: targetMask.district,
          participantAvatarSeed: targetMask.avatarSeed,
          createdAtDaysAgo: 0,
          userMessageCount: 0,
          partnerMessageCount: 0,
          hasUserRequestedNumberShare: false,
          hasPartnerRequestedNumberShare: false,
          lastMessageSnippet: 'Private masked chat started.',
          lastMessageTime: 'Just now',
          unreadCount: 0,
          messages: [
            {
              id: `msg-init-${Date.now()}`,
              senderId: 'system',
              senderName: 'Atoll// System',
              text: 'You are chatting anonymously in Lagoon mode. Contact info and links are strictly blocked for safety.',
              timestamp: 'Just now',
              isSystem: true,
            },
          ],
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentTab: 'chats',
          activeChatId: newChat.id,
        }));

        get().addSystemLog(
          'masked_dm_started',
          `1:1 masked DM initiated between "${get().currentUserMask.nickname}" and "${targetMask.nickname}".`,
          'info'
        );

        return newChat.id;
      },

      // Shore Verified Dating
      verificationStatus: 'approved', // initialized to approved so user can explore, but can be reset or re-run
      setVerificationStatus: (verificationStatus) => set({ verificationStatus }),
      currentUserVerifiedProfile: INITIAL_CURRENT_USER_VERIFIED,
      updateCurrentUserVerifiedProfile: (updates) =>
        set((state) => ({
          currentUserVerifiedProfile: { ...state.currentUserVerifiedProfile, ...updates },
        })),
      shoreProfiles: SEEDED_SHORE_PROFILES,
      dailyIntrosRemaining: 5,
      discoveryLayout: 'deck',
      setDiscoveryLayout: (discoveryLayout) => set({ discoveryLayout }),
      sendShoreIntro: (profileId, introMessage) => {
        const { dailyIntrosRemaining, shoreProfiles, sparksBalance } = get();
        if (dailyIntrosRemaining <= 0) {
          if (sparksBalance < 200) {
            get().addToast(
              'No Intros Left',
              'You used all 5 free daily intros! Top up 200 Sparks to send bonus intros.',
              'warning'
            );
            return false;
          }
          // Spend sparks for bonus intro
          set((state) => ({ sparksBalance: state.sparksBalance - 200 }));
          get().addSystemLog('sparks_spent: bonus_intro', `200 Sparks spent for bonus Shore intro.`, 'financial');
        } else {
          set((state) => ({ dailyIntrosRemaining: state.dailyIntrosRemaining - 1 }));
        }

        const target = shoreProfiles.find((p) => p.id === profileId);
        if (!target) return false;

        // Create new Shore chat
        const newShoreChat: DirectChat = {
          id: `chat-shore-${Date.now()}`,
          type: 'shore_verified',
          participantId: target.id,
          participantName: `${target.firstName} ${target.firstName[0]}.`,
          participantDistrict: target.district,
          participantAvatarSeed: target.avatarSeed,
          isParticipantVerified: true,
          createdAtDaysAgo: 0,
          userMessageCount: 1,
          partnerMessageCount: 0,
          hasUserRequestedNumberShare: false,
          hasPartnerRequestedNumberShare: false,
          partnerPhoneNumber: target.phoneNumber || '+250 788 000 000',
          userPhoneNumber: get().currentUserVerifiedProfile.phoneNumber,
          lastMessageSnippet: introMessage,
          lastMessageTime: 'Just now',
          unreadCount: 0,
          messages: [
            {
              id: `msg-intro-${Date.now()}`,
              senderId: 'current-user',
              senderName: 'Me',
              text: introMessage,
              timestamp: 'Just now',
            },
          ],
        };

        set((state) => ({
          chats: [newShoreChat, ...state.chats],
        }));

        get().addSystemLog(
          'shore_intro_sent',
          `Introduction sent to verified profile ${target.firstName} (${target.district}).`,
          'info'
        );
        get().addToast('Introduction Sent!', `Your note was delivered to ${target.firstName}.`, 'success');
        return true;
      },
      likeShoreProfile: (profileId) => {
        set((state) => ({
          shoreProfiles: state.shoreProfiles.map((p) =>
            p.id === profileId ? { ...p, likedByCurrentUser: !p.likedByCurrentUser } : p
          ),
        }));
      },

      // Monetization
      isAtollPlusActive: true,
      atollPlusExpiry: '30 days remaining',
      sparksBalance: 1500,
      addSparks: (amount) => {
        set((state) => ({ sparksBalance: state.sparksBalance + amount }));
        get().addSystemLog('sparks_purchased', `Added ${amount} Sparks to wallet balance.`, 'financial');
        get().addToast('Sparks Added!', `+${amount} Sparks added to your wallet.`, 'success');
      },
      activateAtollPlusSubscription: (plan) => {
        const expiry = plan === 'week' ? '7 days remaining' : '30 days remaining';
        set({ isAtollPlusActive: true, atollPlusExpiry: expiry });
        get().addSystemLog(
          'atoll_plus_activated',
          `Atoll Plus ${plan === 'week' ? 'Weekly (1,000 RWF)' : 'Monthly (3,000 RWF)'} activated.`,
          'financial'
        );
        get().addToast('Atoll Plus Active', 'Premium filters and mutual likes unlocked!', 'success');
      },

      // Safety & Governance
      systemLogs: SEEDED_SYSTEM_LOGS,
      addSystemLog: (eventType, details, level) => {
        const newLog: SystemLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          eventType,
          details,
          level,
        };
        set((state) => ({ systemLogs: [newLog, ...state.systemLogs].slice(0, 50) }));
      },
      incidentReports: SEEDED_INCIDENTS,
      updateIncidentStatus: (id, status) => {
        set((state) => ({
          incidentReports: state.incidentReports.map((inc) =>
            inc.id === id ? { ...inc, status } : inc
          ),
        }));
        get().addSystemLog('moderator_incident_updated', `Incident ${id} marked as ${status}.`, 'warning');
        get().addToast('Moderator Action', `Incident updated: ${status}.`, 'info');
      },
      toasts: [],
      addToast: (title, message, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        set((state) => ({
          toasts: [...state.toasts, { id, title, message, type }],
        }));
        setTimeout(() => {
          get().removeToast(id);
        }, 4500);
      },
      removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },

      // Demo Control Suite
      demoIdOutcome: 'Approved',
      setDemoIdOutcome: (demoIdOutcome) => {
        set({ demoIdOutcome });
        get().addSystemLog('demo_control_changed: id_outcome', `ID check simulator outcome set to "${demoIdOutcome}".`, 'info');
      },
      demoPaymentOutcome: 'Success',
      setDemoPaymentOutcome: (demoPaymentOutcome) => {
        set({ demoPaymentOutcome });
        get().addSystemLog('demo_control_changed: payment_outcome', `Payment simulator outcome set to "${demoPaymentOutcome}".`, 'info');
      },
      fastForwardTime: () => {
        set((state) => ({
          chats: state.chats.map((chat) => ({
            ...chat,
            createdAtDaysAgo: chat.createdAtDaysAgo + 2,
            userMessageCount: chat.userMessageCount + 6,
            partnerMessageCount: chat.partnerMessageCount + 4,
            hasPartnerRequestedNumberShare: true,
          })),
        }));
        get().addSystemLog(
          'demo_fast_forward: time_aged',
          'Fast-forward executed: aged Shore chats by 2 days and injected +10 messages. Progressive Escrow unlocked!',
          'security'
        );
        get().addToast(
          'Fast-Forward Applied ⚡',
          'All chats aged +2 days with +10 messages. Contact exchange criteria fulfilled!',
          'success'
        );
      },
      resetDemoState: () => {
        set({
          language: 'en',
          isDarkMode: false,
          isDiscreetMode: false,
          currentTab: 'lagoon',
          activeRoomId: null,
          activeChatId: null,
          activePostId: null,
          isPostComposerOpen: false,
          isDemoPanelOpen: false,
          currentUserMask: INITIAL_USER_MASKS[0],
          userMasks: INITIAL_USER_MASKS,
          posts: SEEDED_POSTS,
          categoryFilter: 'All',
          rooms: SEEDED_ROOMS,
          roomMessages: SEEDED_ROOM_MESSAGES,
          chats: SEEDED_CHATS,
          verificationStatus: 'approved',
          currentUserVerifiedProfile: INITIAL_CURRENT_USER_VERIFIED,
          shoreProfiles: SEEDED_SHORE_PROFILES,
          dailyIntrosRemaining: 5,
          isAtollPlusActive: true,
          atollPlusExpiry: '30 days remaining',
          sparksBalance: 1500,
          systemLogs: SEEDED_SYSTEM_LOGS,
          incidentReports: SEEDED_INCIDENTS,
          demoIdOutcome: 'Approved',
          demoPaymentOutcome: 'Success',
        });
        localStorage.removeItem('atoll_app_store_v1');
        get().addToast('Demo Reset', 'All settings and data returned to default prototype state.', 'info');
      },
    }),
    {
      name: 'atoll_app_store_v1',
      partialize: (state) => ({
        language: state.language,
        isDarkMode: state.isDarkMode,
        isDiscreetMode: state.isDiscreetMode,
        currentUserMask: state.currentUserMask,
        userMasks: state.userMasks,
        posts: state.posts,
        rooms: state.rooms,
        roomMessages: state.roomMessages,
        chats: state.chats,
        verificationStatus: state.verificationStatus,
        currentUserVerifiedProfile: state.currentUserVerifiedProfile,
        shoreProfiles: state.shoreProfiles,
        dailyIntrosRemaining: state.dailyIntrosRemaining,
        isAtollPlusActive: state.isAtollPlusActive,
        atollPlusExpiry: state.atollPlusExpiry,
        sparksBalance: state.sparksBalance,
        systemLogs: state.systemLogs,
        incidentReports: state.incidentReports,
        demoIdOutcome: state.demoIdOutcome,
        demoPaymentOutcome: state.demoPaymentOutcome,
      }),
    }
  )
);
