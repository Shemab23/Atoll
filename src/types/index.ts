export type Language = 'en' | 'rw';

export type RwandanDistrict =
  | 'Gasabo'
  | 'Kicukiro'
  | 'Nyarugenge'
  | 'Musanze'
  | 'Rubavu'
  | 'Huye'
  | 'Rwamagana'
  | 'Bugesera'
  | 'Muhanga'
  | 'Rusizi';

export interface Mask {
  id: string;
  nickname: string;
  district: RwandanDistrict;
  avatarSeed: {
    color: string;
    secondaryColor: string;
    shape: 'circle' | 'polygon' | 'island' | 'wave' | 'diamond';
    pattern: 'dots' | 'lines' | 'agaseke' | 'ripple' | 'sol';
  };
  reputationPoints?: number;
  isCurrentUser?: boolean;
}

export type LagoonCategory = 'All' | 'My District' | 'Advice' | 'Fun' | 'Work' | 'Relationships';

export type PromptType =
  | 'Anyone up for...'
  | 'Does anyone else...'
  | 'I need advice on...'
  | 'Story time...';

export interface LagoonReply {
  id: string;
  postId: string;
  authorMask: Mask;
  content: string;
  createdAt: string;
  likes: number;
}

export interface LagoonPost {
  id: string;
  prompt: PromptType;
  content: string;
  category: Exclude<LagoonCategory, 'All' | 'My District'>;
  district: RwandanDistrict;
  isDistrictOnly: boolean;
  authorMask: Mask;
  createdAt: string;
  likes: number;
  replies: LagoonReply[];
  isBoosted?: boolean;
  isHidden?: boolean;
}

export interface TopicRoom {
  id: string;
  name: string;
  kinyaName: string;
  description: string;
  kinyaDescription: string;
  category: string;
  activeMembers: number;
  iconName: string;
  isBuzz?: boolean;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderMask: Mask;
  text: string;
  timestamp: string;
}

export type ChatType = 'lagoon_masked' | 'shore_verified';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  hasMoneyWarning?: boolean;
  blockedReason?: string;
}

export interface DirectChat {
  id: string;
  type: ChatType;
  participantId: string;
  participantName: string;
  participantDistrict: RwandanDistrict;
  participantAvatarSeed: Mask['avatarSeed'];
  isParticipantVerified?: boolean;
  messages: ChatMessage[];
  createdAtDaysAgo: number;
  userMessageCount: number;
  partnerMessageCount: number;
  hasUserRequestedNumberShare: boolean;
  hasPartnerRequestedNumberShare: boolean;
  partnerPhoneNumber?: string;
  userPhoneNumber?: string;
  lastMessageSnippet: string;
  lastMessageTime: string;
  unreadCount: number;
}

export type VerificationStatus = 'not_started' | 'processing' | 'approved' | 'needs_retry' | 'rejected';

export interface VerifiedProfile {
  id: string;
  firstName: string;
  age: number;
  district: RwandanDistrict;
  datingIntent: 'Serious relationship' | 'Friendship first' | 'Marriage-minded';
  languages: string[];
  bio: string;
  interests: string[];
  avatarSeed: Mask['avatarSeed'];
  isVerified: boolean;
  likedByCurrentUser?: boolean;
  likesCurrentUser?: boolean;
  phoneNumber?: string;
  heightCm?: number;
  education?: string;
  religion?: string;
}

export type DemoIdOutcome = 'Approved' | 'Needs Retry' | 'Rejected';
export type DemoPaymentOutcome = 'Success' | 'Declined' | 'Timed out';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  details: string;
  level: 'info' | 'warning' | 'security' | 'financial';
}

export interface IncidentReport {
  id: string;
  targetType: 'post' | 'message' | 'user';
  targetId: string;
  reporterMaskName: string;
  reason: string;
  contentSnippet: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'warned' | 'hidden' | 'suspended';
}
