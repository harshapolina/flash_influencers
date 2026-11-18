import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { config } from "../config.js";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.get("/", async (req: AuthedRequest, res) => {
  const bookings = await store.listBookings(req.user!.id);
  return ok(res, { bookings });
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
        multiplier: z.number().positive().optional().default(1),
      })
      .parse(req.body);

    const creator = await store.findCreator(body.creatorId);
    if (!creator) return fail(res, new Error("Creator not found"), 404);

    const subtotal = Math.round(creator.priceValue * (body.multiplier || 1));
    const fee = Math.round(subtotal * config.platformFeeRate);
    const total = body.price ?? subtotal + fee;
    const booking = {
      id: `ORB-${nanoid(5).toUpperCase()}`,
      brandUserId: req.user!.id,
      creatorId: body.creatorId,
      deliverable: body.deliverable,
      price: total,
      date: body.date,
      location: body.location,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    await store.createBooking(booking);
    await store.createMessage({
      id: nanoid(),
      userId: req.user!.id,
      peerCreatorId: body.creatorId,
      preview: `Booking request sent for ${body.deliverable}.`,
      campaign: body.deliverable,
      time: "now",
      unread: 0,
      category: "campaigns",
    });

    return ok(res, { booking }, 201);
  } catch (error) {
    return fail(res, error);
  }
});
