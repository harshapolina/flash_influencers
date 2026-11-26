import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const campaignsRouter = Router();

campaignsRouter.use(requireAuth);

campaignsRouter.get("/", async (req: AuthedRequest, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const role = req.user!.role;
  const prefs = await store.getPrefs(req.user!.id);
  const campaigns = await store.listCampaigns();

  if (role === "brand") {
    let list = [...campaigns];
    if (status) list = list.filter((c) => c.status === status);
    const mine = list.filter((c) => !c.ownerUserId || c.ownerUserId === req.user!.id);
    const bookings = await store.listBookings(req.user!.id);
    return ok(res, {
      campaigns: mine,
      bookings,
      counts: {
        active: mine.filter((c) => c.status === "active").length,
        applications:
          mine.filter((c) => c.status === "applications").length +
          bookings.filter((b) => b.status === "pending").length,
        completed: mine.filter((c) => c.status === "completed").length,
      },
    });
  }

  const query = String(req.query.query || "").toLowerCase();
  const pill = String(req.query.pill || "For you");
  const savedOnly = String(req.query.savedOnly || "false") === "true";
  const location = String(req.query.location || "").toLowerCase();
  const sort = String(req.query.sort || "recommended");
  const minPay = Number(req.query.minPay || 0);
  const mode = String(req.query.mode || "");

  let list = [...campaigns];

  // Creators see open seed campaigns + booking campaigns meant for them
  const linked = await store.findCreatorByUserId(req.user!.id);
  const myBookings = await store.listBookingsForCreator(req.user!.id, linked?.id);
  const myBookingCampaignIds = new Set(
    myBookings.map((b) => b.campaignId).filter(Boolean) as string[],
  );

  list = list.filter((c) => {
    if (c.source === "booking") return myBookingCampaignIds.has(c.id);
    return true;
  });

  if (savedOnly) list = list.filter((c) => prefs.savedCampaignIds.includes(c.id));
  if (query) {
    list = list.filter((c) =>
      `${c.title} ${c.brand} ${c.type} ${c.location || ""} ${c.brief || ""}`
        .toLowerCase()
        .includes(query),
    );
  }
  if (pill !== "For you") {
    list = list.filter(
      (c) =>
        c.tags.some((t) => t.toLowerCase() === pill.toLowerCase()) ||
        c.type.toLowerCase().includes(pill.toLowerCase()) ||
        (pill === "Nearby" &&
          ["mumbai", "pune", "delhi", "bengaluru"].includes(
            (c.location || "").toLowerCase(),
          )),
    );
  }
  if (location && location !== "all") {
    list = list.filter((c) => (c.location || "").toLowerCase().includes(location));
  }
  if (mode === "instant" || mode === "schedule") {
    list = list.filter((c) => c.bookingMode === mode || c.tags.some((t) => t.toLowerCase() === (mode === "instant" ? "instant" : "scheduled")));
  }
  if (minPay > 0) {
    list = list.filter((c) => {
      const n = Number(String(c.pay).replace(/[^\d]/g, ""));
      return n >= minPay;
    });
  }

  if (sort === "pay") {
    list.sort(
      (a, b) =>
        Number(String(b.pay).replace(/[^\d]/g, "")) -
        Number(String(a.pay).replace(/[^\d]/g, "")),
    );
  } else if (sort === "newest") {
    list.sort((a, b) => {
      const aTime = Date.parse(String((a as { createdAt?: string }).createdAt || "")) || 0;
      const bTime = Date.parse(String((b as { createdAt?: string }).createdAt || "")) || 0;
      if (bTime !== aTime) return bTime - aTime;
      // booking campaigns and higher ids first as a stable newest proxy
      const aBook = a.source === "booking" ? 1 : 0;
      const bBook = b.source === "booking" ? 1 : 0;
      if (bBook !== aBook) return bBook - aBook;
      return String(b.id).localeCompare(String(a.id));
    });
  } else {
    list.sort((a, b) => (b.match || 0) - (a.match || 0));
  }

  return ok(res, {
    campaigns: list,
    savedCampaignIds: prefs.savedCampaignIds,
    appliedCampaignIds: prefs.appliedCampaignIds,
    counts: {
      total: list.length,
      saved: prefs.savedCampaignIds.length,
      applied: prefs.appliedCampaignIds.length,
      booked: myBookings.length,
    },
  });
});

campaignsRouter.post("/:id/save", async (req: AuthedRequest, res) => {
  try {
    const id = req.params.id;
    const prefs = await store.toggleArrayId(req.user!.id, "savedCampaignIds", id);
    return ok(res, {
      savedCampaignIds: prefs.savedCampaignIds,
      saved: prefs.savedCampaignIds.includes(id),
    });
  } catch (error) {
    return fail(res, error);
  }
});

campaignsRouter.post("/:id/apply", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
    const id = req.params.id;
    const campaign = await store.findCampaign(id);
    if (!campaign) return fail(res, new Error("Campaign not found"), 404);

    // Booking campaigns: accept instead of open apply
    if (campaign.bookingId) {
      const booking = await store.findBooking(campaign.bookingId);
      if (!booking) return fail(res, new Error("Booking not found"), 404);
      if (booking.status === "pending") {
        await store.updateBooking(booking.id, { status: "accepted" });
        const work = await store.findWorkByBooking(booking.id);
        if (work) {
          await store.updateWorkItem(work.id, {
            needsAccept: false,
            status: "Confirmed — ready to create",
            progress: Math.max(work.progress, 20),
          });
        }
        if (booking.threadId) {
          await store.createChatMessage({
            id: nanoid(),
            threadId: booking.threadId,
            senderUserId: req.user!.id,
            text: "I'm in — happy to work on this. Let's discuss the brief.",
            createdAt: new Date().toISOString(),
          });
        }
      }
      const prefs = await store.ensurePrefs(req.user!.id);
      if (!prefs.appliedCampaignIds.includes(id)) {
        await store.updatePrefs(req.user!.id, {
          appliedCampaignIds: [...prefs.appliedCampaignIds, id],
        });
      }
      const fresh = await store.getPrefs(req.user!.id);
      return ok(res, {
        applied: true,
        accepted: true,
        appliedCampaignIds: fresh.appliedCampaignIds,
        threadId: booking.threadId,
      });
    }

    const prefs = await store.ensurePrefs(req.user!.id);
    if (!prefs.appliedCampaignIds.includes(id)) {
      await store.updatePrefs(req.user!.id, {
        appliedCampaignIds: [...prefs.appliedCampaignIds, id],
      });
    }

    const threadId = `thread-apply-${id}-${req.user!.id.slice(0, 8)}`;
    const brandUserId = campaign.ownerUserId;
    const now = new Date().toISOString();
    let work = (await store.listWorkItems(req.user!.id)).find((item) => item.campaignId === id);

    if (!work) {
      work = await store.createWorkItem({
        id: `work-${Date.now()}`,
        creatorUserId: req.user!.id,
        brand: campaign.brand,
        title: campaign.title,
        status: "Application sent",
        progress: 10,
        color: campaign.color,
        due: campaign.applyBy,
        bucket: "applications",
        campaignId: id,
        brandUserId,
        threadId,
        pay: campaign.pay,
        location: campaign.location,
        brief: campaign.brief || campaign.deliverables,
      });
    } else if (!work.threadId) {
      work = await store.updateWorkItem(work.id, { threadId, brandUserId: work.brandUserId || brandUserId });
    }

    const existingInbox = await store.findMessageByThread(req.user!.id, threadId);
    if (!existingInbox) {
      await store.createMessage({
        id: nanoid(),
        userId: req.user!.id,
        peerUserId: brandUserId,
        peerName: campaign.brand,
        peerImage: "",
        preview: `You applied to ${campaign.title}.`,
        campaign: campaign.title,
        time: "now",
        unread: 0,
        category: "campaigns",
        threadId,
      });

      if (brandUserId) {
        const brandInbox = await store.findMessageByThread(brandUserId, threadId);
        if (!brandInbox) {
          await store.createMessage({
            id: nanoid(),
            userId: brandUserId,
            peerUserId: req.user!.id,
            peerName: req.user!.name,
            peerImage: req.user!.avatarUrl || "",
            preview: `${req.user!.name} applied to ${campaign.title}.`,
            campaign: campaign.title,
            time: "now",
            unread: 1,
            category: "campaigns",
            threadId,
          });
        }
      }

      await store.createChatMessage({
        id: nanoid(),
        threadId,
        senderUserId: req.user!.id,
        text: `Hi ${campaign.brand} — I've applied for ${campaign.title}. Happy to discuss the brief.`,
        createdAt: now,
      });
    }

    const fresh = await store.getPrefs(req.user!.id);
    return ok(res, {
      applied: true,
      appliedCampaignIds: fresh.appliedCampaignIds,
      threadId: work?.threadId || threadId,
    });
  } catch (error) {
    return fail(res, error);
  }
});

campaignsRouter.get("/work/mine", async (req: AuthedRequest, res) => {
  const bucket = typeof req.query.bucket === "string" ? req.query.bucket : undefined;
  const all = await store.listWorkItems(req.user!.id);
  let items = all;
  if (bucket) items = all.filter((w) => w.bucket === bucket);
  return ok(res, {
    items,
    counts: {
      active: all.filter((i) => i.bucket === "active").length,
      applications: all.filter((i) => i.bucket === "applications").length,
      completed: all.filter((i) => i.bucket === "completed").length,
    },
  });
});

campaignsRouter.post("/work/:id/accept", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
    const work = await store.findWorkItem(req.params.id);
    if (!work || work.creatorUserId !== req.user!.id) {
      return fail(res, new Error("Work item not found"), 404);
    }
    if (work.bookingId) {
      await store.updateBooking(work.bookingId, { status: "accepted" });
    }
    const updated = await store.updateWorkItem(work.id, {
      needsAccept: false,
      status: "Confirmed — ready to create",
      progress: Math.max(work.progress, 20),
      bucket: "active",
    });
    return ok(res, { item: updated });
  } catch (error) {
    return fail(res, error);
  }
});
