import type {
  Booking,
  Campaign,
  ChatLine,
  ChatMessage,
  CreatorProfile,
  Message,
  OtpRecord,
  Transaction,
  User,
  UserPrefs,
  WorkItem,
} from "./types.js";
import {
  BookingModel,
  CampaignModel,
  ChatLineModel,
  ChatMessageModel,
  CreatorModel,
  lean,
  MessageModel,
  OtpModel,
  PrefsModel,
  TransactionModel,
  UserModel,
  WorkItemModel,
} from "./models.js";

const emptyPrefs = (userId: string): UserPrefs => ({
  userId,
  likedCreatorIds: [],
  savedCreatorIds: [],
  savedCampaignIds: [],
  appliedCampaignIds: [],
});

export const store = {
  async findUserByEmail(email: string) {
    return lean<User | null>(await UserModel.findOne({ email }).lean());
  },

  async findUserByGoogleId(googleId: string) {
    return lean<User | null>(await UserModel.findOne({ googleId }).lean());
  },

  async findUserById(id: string) {
    return lean<User | null>(await UserModel.findOne({ id }).lean());
  },

  async createUser(user: User) {
    await UserModel.create(user);
    return user;
  },

  async updateUser(id: string, patch: Partial<User>) {
    const doc = await UserModel.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
    return lean<User | null>(doc);
  },

  async upsertOtp(record: OtpRecord) {
    await OtpModel.findOneAndUpdate({ email: record.email }, record, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  },

  async findOtp(email: string) {
    return lean<OtpRecord | null>(await OtpModel.findOne({ email }).lean());
  },

  async incrementOtpAttempts(email: string) {
    await OtpModel.updateOne({ email }, { $inc: { attempts: 1 } });
  },

  async deleteOtp(email: string) {
    await OtpModel.deleteOne({ email });
  },

  async listCreators() {
    return (await CreatorModel.find().lean()).map((c) => lean<CreatorProfile>(c));
  },

  async findCreator(id: number) {
    return lean<CreatorProfile | null>(await CreatorModel.findOne({ id }).lean());
  },

  async findCreatorByUserId(userId: string) {
    return lean<CreatorProfile | null>(await CreatorModel.findOne({ userId }).lean());
  },

  async linkCreatorUser(creatorId: number, userId: string) {
    const doc = await CreatorModel.findOneAndUpdate(
      { id: creatorId },
      { $set: { userId } },
      { new: true },
    ).lean();
    return lean<CreatorProfile | null>(doc);
  },

  async upsertCreatorProfile(creator: CreatorProfile) {
    const doc = await CreatorModel.findOneAndUpdate(
      { id: creator.id },
      { $set: creator },
      { upsert: true, new: true },
    ).lean();
    return lean<CreatorProfile>(doc);
  },

  async updateCreatorAvailability(
    userId: string,
    patch: {
      available?: boolean;
      sameDay?: boolean;
      leadTime?: string;
      workingDays?: number[];
      startTime?: string;
      endTime?: string;
    },
  ) {
    const existing = await this.findCreatorByUserId(userId);
    if (!existing) return null;
    const availability = {
      workingDays: patch.workingDays ?? existing.availability?.workingDays ?? [1, 2, 3, 4, 5],
      startTime: patch.startTime ?? existing.availability?.startTime ?? "09:00",
      endTime: patch.endTime ?? existing.availability?.endTime ?? "18:00",
      leadTime: patch.leadTime ?? existing.availability?.leadTime ?? "3 days",
      sameDay:
        typeof patch.sameDay === "boolean"
          ? patch.sameDay
          : (existing.availability?.sameDay ?? false),
    };
    const available =
      typeof patch.available === "boolean" ? patch.available : existing.available;
    const doc = await CreatorModel.findOneAndUpdate(
      { id: existing.id },
      { $set: { available, availability } },
      { new: true },
    ).lean();
    return lean<CreatorProfile | null>(doc);
  },

  async nextCreatorId() {
    const last = await CreatorModel.findOne().sort({ id: -1 }).lean();
    return (last?.id || 100) + 1;
  },

  async listCampaigns() {
    return (await CampaignModel.find().lean()).map((c) => lean<Campaign>(c));
  },

  async findCampaign(id: string) {
    return lean<Campaign | null>(await CampaignModel.findOne({ id }).lean());
  },

  async createCampaign(campaign: Campaign) {
    await CampaignModel.create(campaign);
    return campaign;
  },

  async updateCampaign(id: string, patch: Partial<Campaign>) {
    const doc = await CampaignModel.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true },
    ).lean();
    return lean<Campaign | null>(doc);
  },

  async listBookings(filter: { brandUserId?: string; creatorId?: number } = {}) {
    const query: Record<string, unknown> = {};
    if (filter.brandUserId) query.brandUserId = filter.brandUserId;
    if (typeof filter.creatorId === "number") query.creatorId = filter.creatorId;
    return (await BookingModel.find(query).sort({ createdAt: -1 }).lean()).map((b) =>
      lean<Booking>(b),
    );
  },

  async listBookingsForCreator(creatorUserId: string, creatorId?: number) {
    const filter =
      creatorId != null
        ? { $or: [{ creatorUserId }, { creatorId }] }
        : { creatorUserId };
    return (await BookingModel.find(filter).sort({ createdAt: -1 }).lean()).map((b) =>
      lean<Booking>(b),
    );
  },

  async findBooking(id: string) {
    return lean<Booking | null>(await BookingModel.findOne({ id }).lean());
  },

  async createBooking(booking: Booking) {
    await BookingModel.create(booking);
    return booking;
  },

  async updateBooking(id: string, patch: Partial<Booking>) {
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) $unset[key] = 1;
      else $set[key] = value;
    }
    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;
    const doc = await BookingModel.findOneAndUpdate({ id }, update, { new: true }).lean();
    return lean<Booking | null>(doc);
  },

  async listMessages(userId: string) {
    return (
      await MessageModel.find({ userId: { $in: [userId, "system"] } })
        .sort({ _id: -1 })
        .lean()
    ).map((m) => lean<Message>(m));
  },

  async findMessageByThread(userId: string, threadId: string) {
    return lean<Message | null>(
      await MessageModel.findOne({ userId, threadId }).lean(),
    );
  },

  async listChatLines(threadKey: string) {
    return (await ChatLineModel.find({ threadKey }).sort({ createdAt: 1 }).lean()).map((line) =>
      lean<ChatLine>(line),
    );
  },

  async createChatLine(line: ChatLine) {
    await ChatLineModel.create(line);
    return line;
  },

  async createMessage(message: Message) {
    await MessageModel.create(message);
    return message;
  },

  async updateMessage(id: string, patch: Partial<Message>) {
    const doc = await MessageModel.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true },
    ).lean();
    return lean<Message | null>(doc);
  },

  async listChatMessages(threadId: string) {
    return (
      await ChatMessageModel.find({ threadId }).sort({ createdAt: 1 }).lean()
    ).map((m) => lean<ChatMessage>(m));
  },

  async createChatMessage(message: ChatMessage) {
    await ChatMessageModel.create(message);
    return message;
  },

  async upsertInboxPreview(input: {
    userId: string;
    peerCreatorId: number;
    preview: string;
    campaign?: string;
    unread?: number;
    category?: "campaigns" | "general";
  }) {
    const existing = (await MessageModel.findOne({
      userId: input.userId,
      peerCreatorId: input.peerCreatorId,
    })
      .sort({ _id: -1 })
      .lean()) as Message | null;
    if (existing) {
      await MessageModel.updateOne(
        { id: existing.id },
        {
          $set: {
            preview: input.preview,
            time: "now",
            unread: input.unread ?? existing.unread,
            campaign: input.campaign || existing.campaign,
          },
        },
      );
      return;
    }
    await MessageModel.create({
      id: `msg-${Date.now()}`,
      userId: input.userId,
      peerCreatorId: input.peerCreatorId,
      preview: input.preview,
      campaign: input.campaign || "Direct message",
      time: "now",
      unread: input.unread ?? 0,
      category: input.category || "general",
    });
  },

  async markMessageRead(id: string, userId: string) {
    await MessageModel.updateOne(
      { id, userId: { $in: [userId, "system"] } },
      { $set: { userId, unread: 0 } },
    );
  },

  async claimSystemMessages(userId: string) {
    await MessageModel.updateMany({ userId: "system" }, { $set: { userId } });
  },

  async listWorkItems(creatorUserId: string) {
    return (await WorkItemModel.find({ creatorUserId }).lean()).map((w) => lean<WorkItem>(w));
  },

  async findWorkItem(id: string) {
    return lean<WorkItem | null>(await WorkItemModel.findOne({ id }).lean());
  },

  async findWorkByBooking(bookingId: string) {
    return lean<WorkItem | null>(await WorkItemModel.findOne({ bookingId }).lean());
  },

  async createWorkItem(item: WorkItem) {
    await WorkItemModel.create(item);
    return item;
  },

  async updateWorkItem(id: string, patch: Partial<WorkItem>) {
    const doc = await WorkItemModel.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
    return lean<WorkItem | null>(doc);
  },

  async hasWorkItem(creatorUserId: string, campaignId: string) {
    return Boolean(await WorkItemModel.exists({ creatorUserId, campaignId }));
  },

  async claimSystemWork(userId: string) {
    await WorkItemModel.updateMany({ creatorUserId: "system" }, { $set: { creatorUserId: userId } });
  },

  async listTransactions(creatorUserId: string) {
    return (
      await TransactionModel.find({ creatorUserId })
        .sort({ createdAt: -1 })
        .lean()
    ).map((t) => lean<Transaction>(t));
  },

  async createTransaction(tx: Transaction) {
    await TransactionModel.create(tx);
    return tx;
  },

  async claimSystemTransactions(userId: string) {
    await TransactionModel.updateMany(
      { creatorUserId: "system" },
      { $set: { creatorUserId: userId } },
    );
  },

  async getPrefs(userId: string) {
    const prefs = lean<UserPrefs | null>(await PrefsModel.findOne({ userId }).lean());
    return prefs ?? emptyPrefs(userId);
  },

  async ensurePrefs(userId: string, seed?: Partial<UserPrefs>) {
    const existing = await PrefsModel.findOne({ userId }).lean();
    if (existing) return lean<UserPrefs>(existing);
    const prefs = { ...emptyPrefs(userId), ...seed, userId };
    await PrefsModel.create(prefs);
    return prefs;
  },

  async updatePrefs(userId: string, patch: Partial<UserPrefs>) {
    await this.ensurePrefs(userId);
    const prefs = await PrefsModel.findOneAndUpdate(
      { userId },
      { $set: patch },
      { new: true },
    ).lean();
    return lean<UserPrefs>(prefs ?? (await this.ensurePrefs(userId)));
  },

  async toggleArrayId(userId: string, field: keyof UserPrefs, id: string | number) {
    const prefs = await this.ensurePrefs(userId);
    const current = (prefs[field] as Array<string | number>) || [];
    const next = current.includes(id as never)
      ? current.filter((x) => x !== id)
      : [...current, id];
    return this.updatePrefs(userId, { [field]: next } as Partial<UserPrefs>);
  },

  async countCreators() {
    return CreatorModel.countDocuments();
  },

  async seedIfEmpty(data: {
    creators: CreatorProfile[];
    campaigns: Campaign[];
    messages: Message[];
    workItems: WorkItem[];
    transactions: Transaction[];
  }) {
    const count = await CreatorModel.countDocuments();
    if (count > 0) return false;

    if (data.creators.length) await CreatorModel.insertMany(data.creators);
    if (data.campaigns.length) await CampaignModel.insertMany(data.campaigns);
    if (data.messages.length) await MessageModel.insertMany(data.messages);
    if (data.workItems.length) await WorkItemModel.insertMany(data.workItems);
    if (data.transactions.length) await TransactionModel.insertMany(data.transactions);
    return true;
  },

  async syncCreatorAvailability(creators: CreatorProfile[]) {
    let updated = 0;
    for (const creator of creators) {
      if (!creator.availability) continue;
      const result = await CreatorModel.updateOne(
        {
          id: creator.id,
          $or: [{ availability: { $exists: false } }, { availability: null }],
        },
        { $set: { availability: creator.availability } },
      );
      updated += result.modifiedCount || 0;
    }
    return updated;
  },

  async replaceSeed(data: {
    creators: CreatorProfile[];
    campaigns: Campaign[];
    messages: Message[];
    workItems: WorkItem[];
    transactions: Transaction[];
  }) {
    await Promise.all([
      CreatorModel.deleteMany({}),
      CampaignModel.deleteMany({}),
      MessageModel.deleteMany({}),
      WorkItemModel.deleteMany({}),
      TransactionModel.deleteMany({}),
    ]);
    if (data.creators.length) await CreatorModel.insertMany(data.creators);
    if (data.campaigns.length) await CampaignModel.insertMany(data.campaigns);
    if (data.messages.length) await MessageModel.insertMany(data.messages);
    if (data.workItems.length) await WorkItemModel.insertMany(data.workItems);
    if (data.transactions.length) await TransactionModel.insertMany(data.transactions);
  },
};
