import { Router } from "express";
import { randomInt } from "node:crypto";
import { nanoid } from "nanoid";
import { z } from "zod";
import { config } from "../config.js";
import { store } from "../db/store.js";
import type { Booking, CreatorAvailability } from "../db/types.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { hashOtp } from "../utils/crypto.js";
import { fail, ok } from "../utils/http.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

function parseLeadDays(leadTime?: string) {
  const match = (leadTime || "3 days").match(/(\d+)/);
  return match ? Number(match[1]) : 3;
}

function weekdayNumber(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function parseBookingDate(dateLabel: string, bookingType: string) {
  if (bookingType === "instant") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  const parsed = new Date(`${dateLabel} ${new Date().getFullYear()}`);
  if (!Number.isNaN(parsed.getTime())) {
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }
  const fallback = new Date();
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

function validateAgainstAvailability(
  bookingType: "instant" | "scheduled",
  dateLabel: string,
  availability?: CreatorAvailability,
  creatorAvailable?: boolean,
) {
  if (bookingType === "instant") {
    if (!creatorAvailable) throw new Error("Creator is not available for instant booking");
    if (availability && !availability.sameDay) {
      throw new Error("Creator does not accept same-day bookings");
    }
    if (availability?.workingDays?.length) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!availability.workingDays.includes(weekdayNumber(today))) {
        throw new Error("Creator is not working today — try a scheduled booking");
      }
    }
    return;
  }

  if (!availability) return;
  const target = parseBookingDate(dateLabel, bookingType);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lead = parseLeadDays(availability.leadTime);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + lead);
  if (target < minDate) {
    throw new Error(`This creator needs at least ${availability.leadTime} notice`);
  }
  if (availability.workingDays?.length && !availability.workingDays.includes(weekdayNumber(target))) {
    throw new Error("Selected date is outside the creator’s working days");
  }
}

async function bookingsForUser(userId: string, role: "brand" | "creator") {
  if (role === "brand") {
    return store.listBookings({ brandUserId: userId });
  }
  const linked = await store.findCreatorByUserId(userId);
  if (!linked) return [] as Booking[];
  return store.listBookings({ creatorId: linked.id });
}

bookingsRouter.get("/", async (req: AuthedRequest, res) => {
  try {
    const bookings = await bookingsForUser(req.user!.id, req.user!.role);
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
        time: z.string().min(1).optional(),
        location: z.string().min(2),
        bookingType: z.enum(["instant", "scheduled"]).default("scheduled"),
        brief: z.string().max(500).optional(),
        multiplier: z.number().positive().optional().default(1),
      })
      .parse(req.body);

    const creator = await store.findCreator(body.creatorId);
    if (!creator) return fail(res, new Error("Creator not found"), 404);

    try {
      validateAgainstAvailability(
        body.bookingType,
        body.date,
        creator.availability,
        creator.available,
      );
    } catch (error) {
      return fail(res, error, 400);
    }

    const subtotal = Math.round(creator.priceValue * (body.multiplier || 1));
    const fee = Math.round(subtotal * config.platformFeeRate);
    const total = body.price ?? subtotal + fee;
    const typeLabel = body.bookingType === "instant" ? "Instant" : "Scheduled";
    const booking: Booking = {
      id: `ORB-${nanoid(5).toUpperCase()}`,
      brandUserId: req.user!.id,
      creatorId: body.creatorId,
      deliverable: body.deliverable,
      price: total,
      date: body.date,
      time: body.time,
      location: body.location,
      bookingType: body.bookingType,
      brief: body.brief?.trim() || undefined,
      status: "pending",
      brandName: req.user!.name,
      creatorName: creator.name,
      createdAt: new Date().toISOString(),
    };

    await store.createBooking(booking);

    await store.createMessage({
      id: nanoid(),
      userId: req.user!.id,
      peerCreatorId: body.creatorId,
      preview: `${typeLabel} booking request sent for ${body.deliverable}.`,
      campaign: body.deliverable,
      time: "now",
      unread: 1,
      category: "campaigns",
    });

    if (creator.userId) {
      await store.createMessage({
        id: nanoid(),
        userId: creator.userId,
        peerCreatorId: body.creatorId,
        preview: `${req.user!.name} sent a ${typeLabel.toLowerCase()} request for ${body.deliverable} on ${body.date}${body.time ? ` · ${body.time}` : ""}.`,
        campaign: `${req.user!.name} · ${body.deliverable}`,
        time: "now",
        unread: 1,
        category: "campaigns",
      });

      await store.createWorkItem({
        id: `book-${booking.id}`,
        creatorUserId: creator.userId,
        brand: req.user!.name,
        title: `${body.deliverable} · ${typeLabel}`,
        status: "Booking request",
        progress: 10,
        color: body.bookingType === "instant" ? "#ffe08a" : "#d7f28f",
        due: body.date,
        bucket: "applications",
        campaignId: booking.id,
      });
    }

    return ok(res, { booking }, 201);
  } catch (error) {
    return fail(res, error);
  }
});

bookingsRouter.post("/:id/start-otp", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "brand") return fail(res, new Error("Brands only"), 403);
    const booking = await store.findBooking(req.params.id);
    if (!booking) return fail(res, new Error("Booking not found"), 404);
    if (booking.brandUserId !== req.user!.id) return fail(res, new Error("Not your booking"), 403);
    if (booking.status !== "accepted") {
      return fail(res, new Error("Start OTP is only for accepted bookings"), 400);
    }
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const updated = await store.updateBooking(booking.id, {
      startOtpHash: hashOtp(code),
      startOtpExpiresAt: expiresAt,
    });
    if (!updated) return fail(res, new Error("Unable to issue start OTP"), 500);
    await store.createMessage({
      id: nanoid(),
      userId: booking.brandUserId,
      peerCreatorId: booking.creatorId,
      preview: `Start OTP generated for ${booking.deliverable}. Share it with the creator on-site.`,
      campaign: booking.deliverable,
      time: "now",
      unread: 0,
      category: "campaigns",
    });
    return ok(res, { booking: updated, code, expiresAt });
  } catch (error) {
    return fail(res, error);
  }
});

bookingsRouter.post("/:id/verify-start", async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
    const body = z.object({ code: z.string().min(4).max(8) }).parse(req.body);
    const booking = await store.findBooking(req.params.id);
    if (!booking) return fail(res, new Error("Booking not found"), 404);
    const linked = await store.findCreatorByUserId(req.user!.id);
    if (!linked || linked.id !== booking.creatorId) {
      return fail(res, new Error("Not your booking"), 403);
    }
    if (booking.status !== "accepted") {
      return fail(res, new Error("Booking is not ready to start"), 400);
    }
    if (!booking.startOtpHash || !booking.startOtpExpiresAt) {
      return fail(res, new Error("Brand has not generated a start OTP yet"), 400);
    }
    if (new Date(booking.startOtpExpiresAt).getTime() < Date.now()) {
      return fail(res, new Error("Start OTP expired — ask the brand to generate a new one"), 400);
    }
    if (hashOtp(body.code.trim()) !== booking.startOtpHash) {
      return fail(res, new Error("Invalid start OTP"), 400);
    }
    const startedAt = new Date().toISOString();
    const updated = await store.updateBooking(booking.id, {
      status: "in_progress",
      startedAt,
      startOtpHash: undefined,
      startOtpExpiresAt: undefined,
    });
    if (!updated) return fail(res, new Error("Unable to start booking"), 500);

    const workId = `book-${booking.id}`;
    const existing = (await store.listWorkItems(req.user!.id)).find(
      (item) => item.campaignId === booking.id || item.id === workId,
    );
    if (existing) {
      await store.updateWorkItem(existing.id, {
        status: "In progress",
        progress: 60,
        bucket: "active",
      });
    }
    await store.createMessage({
      id: nanoid(),
      userId: booking.brandUserId,
      peerCreatorId: booking.creatorId,
      preview: `${booking.creatorName || "Creator"} started the collaboration for ${booking.deliverable}.`,
      campaign: booking.deliverable,
      time: "now",
      unread: 1,
      category: "campaigns",
    });
    return ok(res, { booking: updated });
  } catch (error) {
    return fail(res, error);
  }
});

bookingsRouter.patch("/:id", async (req: AuthedRequest, res) => {
  try {
    const body = z
      .object({
        status: z.enum(["accepted", "rejected", "completed"]),
      })
      .parse(req.body);

    const booking = await store.findBooking(req.params.id);
    if (!booking) return fail(res, new Error("Booking not found"), 404);

    if (req.user!.role === "creator") {
      const linked = await store.findCreatorByUserId(req.user!.id);
      if (!linked || linked.id !== booking.creatorId) {
        return fail(res, new Error("Not your booking"), 403);
      }
      if (!["accepted", "rejected"].includes(body.status)) {
        return fail(res, new Error("Creators can only accept or reject"), 400);
      }
      if (booking.status !== "pending") {
        return fail(res, new Error("Booking already reviewed"), 400);
      }
    } else if (req.user!.role === "brand") {
      if (booking.brandUserId !== req.user!.id) {
        return fail(res, new Error("Not your booking"), 403);
      }
      if (body.status !== "completed") {
        return fail(res, new Error("Brands can only mark completed"), 400);
      }
      if (!["accepted", "in_progress"].includes(booking.status)) {
        return fail(res, new Error("Only accepted or in-progress bookings can be completed"), 400);
      }
    } else {
      return fail(res, new Error("Unauthorized"), 403);
    }

    const patch: Partial<Booking> = { status: body.status };
    if (body.status === "completed") patch.completedAt = new Date().toISOString();
    const updated = await store.updateBooking(booking.id, patch);
    if (!updated) return fail(res, new Error("Unable to update booking"), 500);

    const typeLabel = booking.bookingType === "instant" ? "Instant" : "Scheduled";

    if (body.status === "accepted" || body.status === "rejected") {
      await store.createMessage({
        id: nanoid(),
        userId: booking.brandUserId,
        peerCreatorId: booking.creatorId,
        preview:
          body.status === "accepted"
            ? `${booking.creatorName || "Creator"} accepted your ${typeLabel.toLowerCase()} booking for ${booking.deliverable}.`
            : `${booking.creatorName || "Creator"} declined your ${typeLabel.toLowerCase()} booking for ${booking.deliverable}.`,
        campaign: booking.deliverable,
        time: "now",
        unread: 1,
        category: "campaigns",
      });

      const creator = await store.findCreator(booking.creatorId);
      if (creator?.userId) {
        const workId = `book-${booking.id}`;
        const existing = (await store.listWorkItems(creator.userId)).find(
          (item) => item.campaignId === booking.id || item.id === workId,
        );
        const patch = {
          status: body.status === "accepted" ? "Confirmed" : "Declined",
          progress: body.status === "accepted" ? 35 : 100,
          bucket: (body.status === "accepted" ? "active" : "completed") as
            | "active"
            | "applications"
            | "completed",
        };
        if (existing) {
          await store.updateWorkItem(existing.id, patch);
        } else if (body.status === "accepted") {
          await store.createWorkItem({
            id: workId,
            creatorUserId: creator.userId,
            brand: booking.brandName || "Brand",
            title: `${booking.deliverable} · ${typeLabel}`,
            status: "Confirmed",
            progress: 35,
            color: "#d7f28f",
            due: booking.date,
            bucket: "active",
            campaignId: booking.id,
          });
        }
      }
    }

    if (body.status === "completed") {
      const creator = await store.findCreator(booking.creatorId);
      if (creator?.userId) {
        const workId = `book-${booking.id}`;
        const existing = (await store.listWorkItems(creator.userId)).find(
          (item) => item.campaignId === booking.id || item.id === workId,
        );
        if (existing) {
          await store.updateWorkItem(existing.id, {
            status: "Delivered",
            progress: 100,
            bucket: "completed",
          });
        } else {
          await store.createWorkItem({
            id: workId,
            creatorUserId: creator.userId,
            brand: booking.brandName || "Brand",
            title: `${booking.deliverable} · ${typeLabel}`,
            status: "Delivered",
            progress: 100,
            color: "#d7f28f",
            due: booking.date,
            bucket: "completed",
            campaignId: booking.id,
          });
        }
        await store.createTransaction({
          id: nanoid(),
          creatorUserId: creator.userId,
          name: booking.brandName || "Brand",
          desc: `${booking.deliverable} payout`,
          amount: `+₹${booking.price.toLocaleString("en-IN")}`,
          status: "Paid",
          createdAt: new Date().toISOString(),
        });
      }
      await store.createMessage({
        id: nanoid(),
        userId: booking.brandUserId,
        peerCreatorId: booking.creatorId,
        preview: `Booking ${booking.id} marked complete for ${booking.deliverable}.`,
        campaign: booking.deliverable,
        time: "now",
        unread: 0,
        category: "campaigns",
      });
    }

    return ok(res, { booking: updated });
  } catch (error) {
    return fail(res, error);
  }
});
