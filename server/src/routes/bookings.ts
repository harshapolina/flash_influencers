import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { config } from "../config.js";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function brandDisplayName(user: { name: string; profile?: Record<string, unknown> }) {
  const company = user.profile?.company;
  if (typeof company === "string" && company.trim()) return company.trim();
  return user.name;
}

bookingsRouter.get("/", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role === "brand") {
      const bookings = await store.listBookings(req.user!.id);
      return ok(res, { bookings });
    }

    const linked = await store.findCreatorByUserId(req.user!.id);
    const bookings = await store.listBookingsForCreator(req.user!.id, linked?.id);
    return ok(res, { bookings });
  } catch (error) {
    return fail(res, error);
  }
});

bookingsRouter.post("/", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "brand") return fail(res, new Error("Brands only"), 403);
    const body = z
      .object({
        creatorId: z.number().int().positive(),
        deliverable: z.string().min(2),
        price: z.number().positive().optional(),
        date: z.string().min(2),
        location: z.string().min(2),
        mode: z.enum(["instant", "schedule"]).default("schedule"),
        brief: z.string().optional(),
        multiplier: z.number().positive().optional().default(1),
      })
      .parse(req.body);

    const creator = await store.findCreator(body.creatorId);
    if (!creator) return fail(res, new Error("Creator not found"), 404);

    const brandName = brandDisplayName(req.user!);
    const subtotal = Math.round(creator.priceValue * (body.multiplier || 1));
    const fee = Math.round(subtotal * config.platformFeeRate);
    const total = body.price ?? subtotal + fee;
    const isInstant = body.mode === "instant";
    const brief =
      body.brief?.trim() ||
      `${brandName} booked you for ${body.deliverable} on ${body.date} in ${body.location}. Deliver authentic content that fits your audience and keep brand mentions natural.`;

    const bookingId = `ORB-${nanoid(5).toUpperCase()}`;
    const campaignId = `book-${bookingId}`;
    const workItemId = `work-${bookingId}`;
    const threadId = `thread-${bookingId}`;
    const now = new Date().toISOString();
    const creatorUserId = creator.userId;

    const booking = {
      id: bookingId,
      brandUserId: req.user!.id,
      brandName,
      creatorId: body.creatorId,
      creatorUserId,
      deliverable: body.deliverable,
      price: total,
      date: body.date,
      location: body.location,
      mode: body.mode,
      brief,
      status: (isInstant ? "accepted" : "pending") as "accepted" | "pending",
      campaignId,
      workItemId,
      threadId,
      createdAt: now,
    };

    await store.createBooking(booking);

    const campaign = {
      id: campaignId,
      ownerUserId: req.user!.id,
      title: body.deliverable,
      brand: brandName,
      pay: formatInr(total),
      type: body.deliverable,
      color: isInstant ? "#d9f2c9" : "#e9d7ff",
      icon: brandName.slice(0, 1).toUpperCase(),
      tags: [
        isInstant ? "Instant" : "Scheduled",
        body.location,
        creator.category === "ugc" ? "UGC" : creator.tags[0] || "Paid",
        "Paid",
      ].filter(Boolean),
      applyBy: body.date,
      match: creator.match || 90,
      status: "active" as const,
      progress: isInstant ? 20 : 5,
      creatorsConfirmed: isInstant ? "1 creator confirmed" : "Awaiting creator OK",
      due: body.date,
      deliverables: body.deliverable,
      needsAttention: isInstant ? undefined : "Creator confirmation needed",
      bookingId,
      bookingMode: body.mode,
      location: body.location,
      brief,
      source: "booking" as const,
    };
    await store.createCampaign(campaign);

    // Brand inbox row
    await store.createMessage({
      id: nanoid(),
      userId: req.user!.id,
      peerUserId: creatorUserId,
      peerCreatorId: body.creatorId,
      peerName: creator.name,
      peerImage: creator.image,
      preview: isInstant
        ? `Instant booking confirmed with ${creator.name.split(" ")[0]}.`
        : `Scheduled booking sent to ${creator.name.split(" ")[0]}.`,
      campaign: body.deliverable,
      time: "now",
      unread: 0,
      category: "campaigns",
      threadId,
      bookingId,
    });

    if (creatorUserId) {
      await store.createWorkItem({
        id: workItemId,
        creatorUserId,
        brand: brandName,
        title: body.deliverable,
        status: isInstant ? "Confirmed — ready to create" : "Brand invite — tap OK to work",
        progress: isInstant ? 20 : 5,
        color: campaign.color,
        due: body.date,
        bucket: "active",
        campaignId,
        bookingId,
        brandUserId: req.user!.id,
        mode: body.mode,
        needsAccept: !isInstant,
        threadId,
        pay: formatInr(total),
        location: body.location,
        brief,
      });

      await store.createMessage({
        id: nanoid(),
        userId: creatorUserId,
        peerUserId: req.user!.id,
        peerCreatorId: body.creatorId,
        peerName: brandName,
        peerImage: "",
        preview: isInstant
          ? `${brandName} booked you instantly for ${body.deliverable}.`
          : `${brandName} scheduled a collab for ${body.deliverable}. Review & OK to work.`,
        campaign: body.deliverable,
        time: "now",
        unread: 1,
        category: "campaigns",
        threadId,
        bookingId,
      });

      const opener = isInstant
        ? `Hi ${creator.name.split(" ")[0]}! Instant booking confirmed for ${body.deliverable} on ${body.date} (${body.location}). Pay ${formatInr(total)}. Looking forward to working together.`
        : `Hi ${creator.name.split(" ")[0]}! We'd love to book you for ${body.deliverable} on ${body.date} in ${body.location}. Pay ${formatInr(total)}. Please OK the invite when you're ready.`;

      await store.createChatMessage({
        id: nanoid(),
        threadId,
        senderUserId: req.user!.id,
        text: opener,
        createdAt: now,
      });

      if (isInstant) {
        const prefs = await store.ensurePrefs(creatorUserId);
        if (!prefs.appliedCampaignIds.includes(campaignId)) {
          await store.updatePrefs(creatorUserId, {
            appliedCampaignIds: [...prefs.appliedCampaignIds, campaignId],
          });
        }
      }
    }

    return ok(res, { booking }, 201);
  } catch (error) {
    return fail(res, error);
  }
});

bookingsRouter.post("/:id/accept", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
    const booking = await store.findBooking(req.params.id);
    if (!booking) return fail(res, new Error("Booking not found"), 404);

    const linked = await store.findCreatorByUserId(req.user!.id);
    const owns =
      booking.creatorUserId === req.user!.id ||
      (linked && linked.id === booking.creatorId);
    if (!owns) return fail(res, new Error("Not your booking"), 403);

    const updated = await store.updateBooking(booking.id, { status: "accepted" });
    const work = await store.findWorkByBooking(booking.id);
    if (work) {
      await store.updateWorkItem(work.id, {
        needsAccept: false,
        status: "Confirmed — ready to create",
        progress: Math.max(work.progress, 20),
        bucket: "active",
      });
    }
    if (booking.campaignId) {
      await store.updateCampaign(booking.campaignId, {
        creatorsConfirmed: "1 creator confirmed",
        needsAttention: undefined,
        progress: 20,
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

      const brandInbox = await store.findMessageByThread(booking.brandUserId, booking.threadId);
      if (brandInbox) {
        await store.updateMessage(brandInbox.id, {
          preview: `${req.user!.name.split(" ")[0]} accepted your booking.`,
          time: "now",
          unread: (brandInbox.unread || 0) + 1,
        });
      }
      const creatorInbox = await store.findMessageByThread(req.user!.id, booking.threadId);
      if (creatorInbox) {
        await store.updateMessage(creatorInbox.id, {
          preview: "You accepted this booking. Chat is open.",
          time: "now",
          unread: 0,
        });
      }
    }

    return ok(res, { booking: updated, work });
  } catch (error) {
    return fail(res, error);
  }
});

bookingsRouter.post("/:id/decline", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
    const booking = await store.findBooking(req.params.id);
    if (!booking) return fail(res, new Error("Booking not found"), 404);

    const linked = await store.findCreatorByUserId(req.user!.id);
    const owns =
      booking.creatorUserId === req.user!.id ||
      (linked && linked.id === booking.creatorId);
    if (!owns) return fail(res, new Error("Not your booking"), 403);

    const updated = await store.updateBooking(booking.id, { status: "declined" });
    const work = await store.findWorkByBooking(booking.id);
    if (work) {
      await store.updateWorkItem(work.id, {
        needsAccept: false,
        status: "Declined",
        bucket: "completed",
        progress: 0,
      });
    }
    return ok(res, { booking: updated });
  } catch (error) {
    return fail(res, error);
  }
});
