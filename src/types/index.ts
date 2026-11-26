export type IconName =
  | "home"
  | "search"
  | "briefcase"
  | "message"
  | "user"
  | "bell"
  | "heart"
  | "arrow"
  | "chevron"
  | "pin"
  | "star"
  | "sparkles"
  | "filter"
  | "check"
  | "instagram"
  | "youtube"
  | "facebook"
  | "link"
  | "close"
  | "calendar"
  | "shield"
  | "wallet"
  | "trending"
  | "clock"
  | "camera"
  | "bookmark"
  | "plus";

export type OnboardingRole = "brand" | "creator";

export type BrandTab = "Home" | "Explore" | "Campaigns" | "Inbox" | "Profile";
export type CreatorTab = "Home" | "Opportunities" | "Work" | "Earnings" | "Profile";

/** Secondary screens from Figma Make (`PrototypeFlowScreen`). */
export type FlowName =
  | "notifications"
  | "saved-creators"
  | "saved-opportunities"
  | "campaign-create"
  | "brand-campaign"
  | "creator-campaign"
  | "submissions"
  | "applications"
  | "payment"
  | "brand-analytics"
  | "creator-analytics"
  | "invite"
  | "ai-assistant"
  | "opportunity"
  | "withdraw"
  | "transactions"
  | "brief-preview"
  | "profile-section";

export type AppFlow = {
  name: FlowName;
  title?: string;
  context?: string;
  role?: OnboardingRole;
};

export type CreatorAvailability = {
  workingDays: number[];
  startTime: string;
  endTime: string;
  leadTime: string;
  sameDay: boolean;
};

export type Creator = {
  id: number;
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
  title: string;
  brand: string;
  pay: string;
  type: string;
  color: string;
  icon: string;
  tags: string[];
  applyBy: string;
  match?: number;
};

export type BrandCampaign = {
  id: string;
  title: string;
  brand: string;
  status: "active" | "applications" | "completed";
  progress: number;
  creatorsConfirmed: string;
  due: string;
  deliverables: string;
  needsAttention?: string;
};

export type InboxMessage = {
  id: string;
  creatorId: number;
  creatorName?: string;
  creatorImage?: string;
  preview: string;
  campaign: string;
  time: string;
  unread: number;
  category: "campaigns" | "general";
};

export type Booking = {
  id: string;
  creatorId: number;
  deliverable: string;
  price: number;
  date: string;
  time?: string;
  location: string;
  bookingType?: BookingType;
  brief?: string;
  status: "pending" | "accepted" | "rejected" | "in_progress" | "completed";
  brandName?: string;
  creatorName?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type ExploreFilters = {
  category: "all" | "influencer" | "ugc" | "affiliate";
  city: string;
  minFollowers: number;
  maxFollowers: number;
  availableOnly: boolean;
  niche: string;
  sort: "match" | "followers" | "price";
  savedOnly: boolean;
};

export type WorkItem = {
  id: string;
  brand: string;
  title: string;
  status: string;
  progress: number;
  color: string;
  due: string;
  bucket: "active" | "applications" | "completed";
};

export type AppPersistedState = {
  onboardingDone: boolean;
  role: OnboardingRole;
  likedIds: number[];
  savedIds: number[];
  savedCampaignIds: string[];
  appliedCampaignIds: string[];
  bookings: Booking[];
  filters: ExploreFilters;
};