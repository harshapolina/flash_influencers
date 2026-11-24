import type {
  Booking,
  Campaign,
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

  async listCampaigns() {
    return (await CampaignModel.find().lean()).map((c) => lean<Campaign>(c));
  },

  async findCampaign(id: string) {
    return lean<Campaign | null>(await CampaignModel.findOne({ id }).lean());
  },

  async listBookings(brandUserId?: string) {
    const filter = brandUserId ? { brandUserId } : {};
    return (await BookingModel.find(filter).sort({ createdAt: -1 }).lean()).map((b) =>
      lean<Booking>(b),
    );
  },

  async createBooking(booking: Booking) {
    await BookingModel.create(booking);
    return booking;
  },

  async listMessages(userId: string) {
    return (
      await MessageModel.find({ userId: { $in: [userId, "system"] } })
        .sort({ _id: -1 })
        .lean()
    ).map((m) => lean<Message>(m));
  },

  async createMessage(message: Message) {
    await MessageModel.create(message);
    return message;
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

  async createWorkItem(item: WorkItem) {
    await WorkItemModel.create(item);
    return item;
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
    const prefs = await PrefsModel.findOneAndUpdate(
      { userId },
      { $set: patch, $setOnInsert: emptyPrefs(userId) },
      { upsert: true, new: true },
    ).lean();
    return lean<UserPrefs>(prefs);
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
