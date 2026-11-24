import { Router } from "express";
import { z } from "zod";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok, publicUser } from "../utils/http.js";

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);

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

    const fresh = await store.updateUser(req.user!.id, {
      ...(body.role ? { role: body.role } : {}),
      profile: body.profile ? { ...(current.profile || {}), ...body.profile } : current.profile || {},
      onboardingDone: true,
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    });

    await store.ensurePrefs(req.user!.id);

    return ok(res, { user: publicUser(fresh!) });
  } catch (error) {
    return fail(res, error);
  }
});
