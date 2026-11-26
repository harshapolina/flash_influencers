import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, default: "" },
    googleId: { type: String, index: true, sparse: true },
    avatarUrl: String,
    authProvider: { type: String, enum: ["password", "google", "apple"], default: "password" },
    role: { type: String, enum: ["brand", "creator"], required: true },
    emailVerified: { type: Boolean, default: false },
    onboardingDone: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },
    onboardingPhase: { type: String, enum: ["common", "role"], default: "common" },
    profile: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

const OtpSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["verify", "login"], default: "verify" },
    expiresAt: { type: String, required: true },
    attempts: { type: Number, default: 0 },
  },
  { versionKey: false },
);

const CreatorSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    name: String,
    handle: String,
    city: String,
    niche: String,
    followers: String,
    followersCount: Number,
    engagement: String,
    views: String,
    price: String,
    priceValue: Number,
    match: Number,
    image: String,
    available: Boolean,
    category: { type: String, enum: ["influencer", "ugc", "affiliate"] },
    tags: [String],
    availability: {
      workingDays: [Number],
      startTime: String,
      endTime: String,
      leadTime: String,
      sameDay: Boolean,
    },
  },
  { versionKey: false },
);

const CampaignSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    ownerUserId: String,
    title: String,
    brand: String,
    pay: String,
    type: String,
    color: String,
    icon: String,
    tags: [String],
    applyBy: String,
    match: Number,
    status: { type: String, enum: ["active", "applications", "completed"] },
    progress: Number,
    creatorsConfirmed: String,
    due: String,
    deliverables: String,
    needsAttention: String,
    bookingId: String,
    bookingMode: { type: String, enum: ["instant", "schedule"] },
    location: String,
    brief: String,
    source: { type: String, enum: ["seed", "booking"], default: "seed" },
  },
  { versionKey: false },
);

const BookingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    brandUserId: { type: String, index: true },
    brandName: String,
    creatorId: { type: Number, index: true },
    creatorUserId: { type: String, index: true },
    deliverable: String,
    price: Number,
    date: String,
    time: String,
    location: String,
    bookingType: { type: String, enum: ["instant", "scheduled"], default: "scheduled" },
    mode: { type: String, enum: ["instant", "schedule"], default: "schedule" },
    brief: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "in_progress", "completed", "declined"],
      default: "pending",
    },
    brandName: String,
    creatorName: String,
    campaignId: String,
    workItemId: String,
    threadId: String,
    createdAt: String,
    startOtpHash: String,
    startOtpExpiresAt: String,
    startedAt: String,
    completedAt: String,
  },
  { versionKey: false },
);

const MessageSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    peerUserId: String,
    peerCreatorId: Number,
    peerName: String,
    peerImage: String,
    preview: String,
    campaign: String,
    time: String,
    unread: Number,
    category: { type: String, enum: ["campaigns", "general"] },
    threadId: { type: String, index: true },
    bookingId: String,
  },
  { versionKey: false },
);

const ChatMessageSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    threadId: { type: String, required: true, index: true },
    senderUserId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

const WorkItemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    creatorUserId: { type: String, index: true },
    brand: String,
    title: String,
    status: String,
    progress: Number,
    color: String,
    due: String,
    bucket: { type: String, enum: ["active", "applications", "completed"] },
    campaignId: String,
    bookingId: { type: String, index: true },
    brandUserId: String,
    mode: { type: String, enum: ["instant", "schedule"] },
    needsAccept: Boolean,
    threadId: String,
    pay: String,
    location: String,
    brief: String,
  },
  { versionKey: false },
);

const TransactionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    creatorUserId: { type: String, index: true },
    name: String,
    desc: String,
    amount: String,
    status: String,
    createdAt: String,
    brand: String,
    client: String,
    business: String,
    campaignId: { type: String, index: true },
  },
  { versionKey: false },
);

const PrefsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    likedCreatorIds: { type: [Number], default: [] },
    savedCreatorIds: { type: [Number], default: [] },
    savedCampaignIds: { type: [String], default: [] },
    appliedCampaignIds: { type: [String], default: [] },
  },
  { versionKey: false },
);

const ChatLineSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    threadKey: { type: String, required: true, index: true },
    senderUserId: { type: String, required: true, index: true },
    peerCreatorId: { type: Number, required: true, index: true },
    text: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export const OtpModel = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
export const CreatorModel = mongoose.models.Creator || mongoose.model("Creator", CreatorSchema);
export const CampaignModel =
  mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
export const MessageModel = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export const ChatMessageModel =
  mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema);
export const WorkItemModel =
  mongoose.models.WorkItem || mongoose.model("WorkItem", WorkItemSchema);
export const TransactionModel =
  mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
export const PrefsModel = mongoose.models.Prefs || mongoose.model("Prefs", PrefsSchema);
export const ChatLineModel =
  mongoose.models.ChatLine || mongoose.model("ChatLine", ChatLineSchema);

export function lean<T>(doc: any): T {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, ...rest } = obj;
  return rest as T;
}
