export type Role = "brand" | "creator";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  googleId?: string;
  avatarUrl?: string;
  authProvider?: "password" | "google" | "apple";
  role: Role;
  emailVerified: boolean;
  onboardingDone: boolean;
  onboardingStep: number;
  onboardingPhase: "common" | "role";
  profile: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type OtpRecord = {
  email: string;
  codeHash: string;
  purpose: "verify" | "login";
  expiresAt: string;
  attempts: number;
};

export type CreatorProfile = {
  id: number;
  userId?: string;
  name: string;
  handle: string;
  city: string;
  niche: string;
  followers: string;
  followersCount: number;
  engagement: string;
  views: string;
  price: string;
  priceValue: number;
  match: number;
  image: string;
  available: boolean;
  category: "influencer" | "ugc" | "affiliate";
  tags: string[];
};

export type Campaign = {
  id: string;
  ownerUserId?: string;
  title: string;
  brand: string;
  pay: string;
  type: string;
  color: string;
  icon: string;
  tags: string[];
  applyBy: string;
  match: number;
  status: "active" | "applications" | "completed";
  progress: number;
  creatorsConfirmed: string;
  due: string;
  deliverables: string;
  needsAttention?: string;
  bookingId?: string;
  bookingMode?: "instant" | "schedule";
  location?: string;
  brief?: string;
  source?: "seed" | "booking";
};

export type Booking = {
  id: string;
  brandUserId: string;
  brandName: string;
  creatorId: number;
  creatorUserId?: string;
  deliverable: string;
  price: number;
  date: string;
  location: string;
  mode: "instant" | "schedule";
  brief: string;
  status: "pending" | "accepted" | "completed" | "declined";
  campaignId?: string;
  workItemId?: string;
  threadId?: string;
  createdAt: string;
};

export type Message = {
  id: string;
  userId: string;
  peerUserId?: string;
  peerCreatorId?: number;
  peerName?: string;
  peerImage?: string;
  preview: string;
  campaign: string;
  time: string;
  unread: number;
  category: "campaigns" | "general";
  threadId?: string;
  bookingId?: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderUserId: string;
  text: string;
  createdAt: string;
};

export type WorkItem = {
  id: string;
  creatorUserId: string;
  brand: string;
  title: string;
  status: string;
  progress: number;
  color: string;
  due: string;
  bucket: "active" | "applications" | "completed";
  campaignId?: string;
  bookingId?: string;
  brandUserId?: string;
  mode?: "instant" | "schedule";
  needsAccept?: boolean;
  threadId?: string;
  pay?: string;
  location?: string;
  brief?: string;
};

export type Transaction = {
  id: string;
  creatorUserId: string;
  name: string;
  desc: string;
  amount: string;
  status: string;
  createdAt: string;
  brand?: string;
  client?: string;
  business?: string;
  campaignId?: string;
};

export type UserPrefs = {
  userId: string;
  likedCreatorIds: number[];
  savedCreatorIds: number[];
  savedCampaignIds: string[];
  appliedCampaignIds: string[];
};

export type Database = {
  users: User[];
  otps: OtpRecord[];
  creators: CreatorProfile[];
  campaigns: Campaign[];
  bookings: Booking[];
  messages: Message[];
  chatMessages: ChatMessage[];
  workItems: WorkItem[];
  transactions: Transaction[];
  prefs: UserPrefs[];
};
