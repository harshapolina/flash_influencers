import { Router } from "express";
import { z } from "zod";
import { store } from "../db/store.js";
import type { CreatorAvailability, CreatorProfile } from "../db/types.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok, publicUser } from "../utils/http.js";

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);

function parseSchedule(raw: unknown): CreatorAvailability | undefined {
  if (!raw) return undefined;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return undefined;
    const data = parsed as Record<string, unknown>;
    return {
      workingDays: Array.isArray(data.workingDays)
        ? data.workingDays.map(Number).filter((n) => n >= 1 && n <= 7)
        : [1, 2, 3, 4, 5],
      startTime: typeof data.startTime === "string" ? data.startTime : "09:00",
      endTime: typeof data.endTime === "string" ? data.endTime : "18:00",
      leadTime: typeof data.leadTime === "string" ? data.leadTime : "3 days",
      sameDay: Boolean(data.sameDay),
    };
  } catch {
    return undefined;
  }
}

function formatPrice(value: number) {
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${value}`;
}

async function promoteCreatorProfile(
  userId: string,
  name: string,
  profile: Record<string, unknown>,
) {
  const fields = (profile.fields || {}) as Record<string, string>;
  const availability = parseSchedule(fields["Availability:SCHEDULE"]);
  const existing = await store.findCreatorByUserId(userId);
  const priceRaw = fields["Pricing Preferences:AMOUNT"] || "";
  const priceValue = Number(String(priceRaw).replace(/[^\d]/g, "")) || existing?.priceValue || 18000;
  const handle =
    fields["Personal Information:DISPLAY NAME"] ||
    fields["Personal Information:HANDLE"] ||
    existing?.handle ||
    `@${name.toLowerCase().replace(/\s+/g, "")}`;
  const city =
    fields["Location Details:LOCATION"] ||
    fields["Location Details:CITY"] ||
    existing?.city ||
    "Mumbai";
  const niche =
    fields["Creator Category:CATEGORY"] ||
    fields["Content Categories:CATEGORIES"] ||
    existing?.niche ||
    "Creator";
  const image =
    (typeof profile.avatarUrl === "string" && profile.avatarUrl) ||
    existing?.image ||
    "https://images.unsplash.com/photo-1747264464985-2bc2e20c739e?crop=faces&fit=crop&w=800&h=1040&q=90";

  const creator: CreatorProfile = {
    id: existing?.id || (await store.nextCreatorId()),
    userId,
    name: fields["Personal Information:LEGAL NAME"] || fields["Personal Information:DISPLAY NAME"] || name,
    handle: handle.startsWith("@") ? handle : `@${handle}`,
    city: city.split(",")[0].trim(),
    niche,
    followers: existing?.followers || "12K",
    followersCount: existing?.followersCount || 12000,
    engagement: existing?.engagement || "4.5%",
    views: existing?.views || "18K",
    price: formatPrice(priceValue),
    priceValue,
    match: existing?.match || 86,
    image,
    available: true,
    category: existing?.category || "influencer",
    tags: existing?.tags?.length ? existing.tags : niche.split(/[·,]/).map((t) => t.trim()).filter(Boolean).slice(0, 4),
    availability: availability ||
      existing?.availability || {
        workingDays: [1, 2, 3, 4, 5],
        startTime: "09:00",
        endTime: "18:00",
        leadTime: "3 days",
        sameDay: false,
      },
  };

  await store.upsertCreatorProfile(creator);
  return creator;
}

onboardingRouter.patch("/progress", async (req: AuthedRequest, res) => {
  try {
    const body = z
      .object({
        phase: z.enum(["common", "role"]).optional(),
        step: z.number().int().min(0).optional(),
        role: z.enum(["brand", "creator"]).optional(),
        profile: z.record(z.unknown()).optional(),
        answers: z.record(z.unknown()).optional(),
      })
      .parse(req.body);

    const current = await store.findUserById(req.user!.id);
    if (!current) throw new Error("User not found");

    let profile: Record<string, unknown> = { ...(current.profile || {}) };
    if (body.profile) profile = { ...profile, ...body.profile };
    if (body.answers) {
      const prev = (profile.answers as Record<string, unknown>) || {};
      profile = { ...profile, answers: { ...prev, ...body.answers } };
    }

    const fresh = await store.updateUser(req.user!.id, {
      ...(body.phase ? { onboardingPhase: body.phase } : {}),
      ...(typeof body.step === "number" ? { onboardingStep: body.step } : {}),
      ...(body.role ? { role: body.role } : {}),
      profile,
      updatedAt: new Date().toISOString(),
    });

    return ok(res, { user: publicUser(fresh!) });
  } catch (error) {
    return fail(res, error);
  }
});

onboardingRouter.post("/complete", async (req: AuthedRequest, res) => {
  try {
    const body = z
      .object({
        role: z.enum(["brand", "creator"]).optional(),
        profile: z.record(z.unknown()).optional(),
      })
      .parse(req.body ?? {});

    const current = await store.findUserById(req.user!.id);
    if (!current) throw new Error("User not found");

    const role = body.role || current.role;
    const profile = body.profile
      ? { ...(current.profile || {}), ...body.profile }
      : current.profile || {};

    const fresh = await store.updateUser(req.user!.id, {
      role,
      profile,
      onboardingDone: true,
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    });

    await store.ensurePrefs(req.user!.id);

    if (role === "creator" && fresh) {
      await promoteCreatorProfile(fresh.id, fresh.name, profile);
    }

    return ok(res, { user: publicUser(fresh!) });
  } catch (error) {
    return fail(res, error);
  }
});
