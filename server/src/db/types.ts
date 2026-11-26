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

export type CreatorAvailability = {
  workingDays: number[];
  startTime: string;
  endTime: string;
  leadTime: string;
  sameDay: boolean;
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
  availability?: CreatorAvailability;
};

export type BookingType = "instant" | "scheduled";

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
};

export type Booking = {
  id: string;
  brandUserId: string;
  creatorId: number;
  deliverable: string;
  price: number;
  date: string;
  time?: string;
  location: string;
  bookingType: BookingType;
  brief?: string;
  status: "pending" | "accepted" | "rejected" | "in_progress" | "completed";
  brandName?: string;
  creatorName?: string;
  createdAt: string;
  startOtpHash?: string;
  startOtpExpiresAt?: string;
  startedAt?: string;
  completedAt?: string;
};

export type Message = {
  id: string;
  userId: string;
  peerCreatorId: number;
  preview: string;
  campaign: string;
  time: string;
  unread: number;
  category: "campaigns" | "general";
};

export type ChatLine = {
  id: string;
  threadKey: string;
  senderUserId: string;
  peerCreatorId: number;
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
};

export type Transaction = {
  id: string;
  creatorUserId: string;
  name: string;
  desc: string;
  amount: string;
  status: string;
  createdAt: string;
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
  workItems: WorkItem[];
  transactions: Transaction[];
  prefs: UserPrefs[];
};
