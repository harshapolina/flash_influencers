import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const campaignsRouter = Router();

campaignsRouter.use(requireAuth);

campaignsRouter.post("/", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "brand") return fail(res, new Error("Brands only"), 403);
    const body = z
      .object({
        title: z.string().min(2).max(120),
        type: z.string().optional().default("Instagram Reel"),
        pay: z.string().optional().default("₹80,000"),
        deliverables: z.string().optional().default("Reels and Stories"),
        tags: z.array(z.string()).optional().default(["Fashion", "Lifestyle"]),
        due: z.string().optional(),
        applyBy: z.string().optional(),
      })
      .parse(req.body);

    const brandName =
      (typeof req.user!.profile?.brandName === "string" && req.user!.profile.brandName) ||
      req.user!.name ||
      "Brand";
    const due = body.due || "30 days";
    const applyBy = body.applyBy || "Open";
    const campaign = await store.createCampaign({
      id: `cmp-${nanoid(8)}`,
      ownerUserId: req.user!.id,
      title: body.title,
      brand: brandName,
      pay: body.pay,
      type: body.type,
      color: "#E8F0E4",
      icon: body.title.slice(0, 2).toUpperCase(),
      tags: body.tags,
      applyBy,
      match: 90,
      status: "applications",
      progress: 5,
      creatorsConfirmed: "0 confirmed",
      due,
      deliverables: body.deliverables,
      needsAttention: "New campaign — invite creators",
    });
    return ok(res, { campaign });
  } catch (error) {
    return fail(res, error);
  }
});

campaignsRouter.get("/", async (req: AuthedRequest, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const role = req.user!.role;
  const prefs = await store.getPrefs(req.user!.id);
  const campaigns = await store.listCampaigns();

  if (role === "brand") {
    let list = [...campaigns];
    if (status) list = list.filter((c) => c.status === status);
    const bookings = await store.listBookings({ brandUserId: req.user!.id });
    const pendingBookings = bookings.filter((b) => b.status === "pending").length;
    const acceptedBookings = bookings.filter((b) => b.status === "accepted").length;
    const completedBookings = bookings.filter((b) => b.status === "completed").length;
    return ok(res, {
      campaigns: list,
      bookings,
      counts: {
        active: campaigns.filter((c) => c.status === "active").length + acceptedBookings,
        applications:
          campaigns.filter((c) => c.status === "applications").length + pendingBookings,
        completed: campaigns.filter((c) => c.status === "completed").length + completedBookings,
      },
    });
  }

  const query = String(req.query.query || "").toLowerCase();
  const pill = String(req.query.pill || "For you");
  const savedOnly = String(req.query.savedOnly || "false") === "true";
  let list = [...campaigns];
  if (savedOnly) list = list.filter((c) => prefs.savedCampaignIds.includes(c.id));
  if (query) {
    list = list.filter((c) => `${c.title} ${c.brand} ${c.type}`.toLowerCase().includes(query));
  }
  if (pill !== "For you") {
    list = list.filter((c) => c.tags.some((t) => t.toLowerCase() === pill.toLowerCase()));
  }
  return ok(res, {
    campaigns: list,
    savedCampaignIds: prefs.savedCampaignIds,
    appliedCampaignIds: prefs.appliedCampaignIds,
  });
});

campaignsRouter.post("/:id/save", async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const prefs = await store.toggleArrayId(req.user!.id, "savedCampaignIds", id);
  return ok(res, {
    savedCampaignIds: prefs.savedCampaignIds,
    saved: prefs.savedCampaignIds.includes(id),
  });
});

campaignsRouter.post("/:id/apply", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
    const id = req.params.id;
    const campaign = await store.findCampaign(id);
    if (!campaign) return fail(res, new Error("Campaign not found"), 404);

    const prefs = await store.ensurePrefs(req.user!.id);
    if (!prefs.appliedCampaignIds.includes(id)) {
      await store.updatePrefs(req.user!.id, {
        appliedCampaignIds: [...prefs.appliedCampaignIds, id],
      });
    }

    const exists = await store.hasWorkItem(req.user!.id, id);
    if (!exists) {
      await store.createWorkItem({
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
      });
    }

    const fresh = await store.getPrefs(req.user!.id);
    return ok(res, { applied: true, appliedCampaignIds: fresh.appliedCampaignIds });
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
