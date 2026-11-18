import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { config } from "../config.js";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok, publicUser } from "../utils/http.js";
import {
  generateOtp,
  hashOtp,
  hashPassword,
  signToken,
  verifyPassword,
} from "../utils/crypto.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["brand", "creator"]),
});

authRouter.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase().trim();
    const existing = await store.findUserByEmail(email);
    if (existing) return fail(res, new Error("Email already registered"), 409);

    const now = new Date().toISOString();
    const user = {
      id: nanoid(),
      name: body.name.trim(),
      email,
      passwordHash: await hashPassword(body.password),
      role: body.role,
      emailVerified: false,
      onboardingDone: false,
      onboardingStep: 0,
      onboardingPhase: "common" as const,
      profile: { company: body.role === "brand" ? "The Loom" : undefined },
      createdAt: now,
      updatedAt: now,
    };

    await store.createUser(user);
    await store.ensurePrefs(user.id, { likedCreatorIds: [2] });

    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    return ok(res, { token, user: publicUser(user) }, 201);
  } catch (error) {
    return fail(res, error);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const body = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body);
    const user = await store.findUserByEmail(body.email.toLowerCase().trim());
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return fail(res, new Error("Invalid email or password"), 401);
    }
    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    return ok(res, { token, user: publicUser(user) });
  } catch (error) {
    return fail(res, error);
  }
});

authRouter.post("/otp/send", async (req, res) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        purpose: z.enum(["verify", "login"]).default("verify"),
      })
      .parse(req.body);
    const email = body.email.toLowerCase().trim();
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + config.otpTtlMs).toISOString();

    await store.upsertOtp({
      email,
      codeHash: hashOtp(code),
      purpose: body.purpose,
      expiresAt,
      attempts: 0,
    });

    console.log(`[OTP] ${email} => ${code} (expires ${expiresAt})`);

    return ok(res, {
      ok: true,
      expiresInSec: Math.floor(config.otpTtlMs / 1000),
      ...(config.isDev ? { devCode: code } : {}),
      message: `Verification code sent to ${email}`,
    });
  } catch (error) {
    return fail(res, error);
  }
});

authRouter.post("/otp/verify", async (req, res) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        code: z.string().min(4).max(8),
      })
      .parse(req.body);
    const email = body.email.toLowerCase().trim();
    const record = await store.findOtp(email);
    if (!record) return fail(res, new Error("No OTP requested for this email"), 400);
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return fail(res, new Error("OTP expired. Request a new code."), 400);
    }
    if (record.attempts >= 5) return fail(res, new Error("Too many attempts"), 429);

    const valid = hashOtp(body.code.trim()) === record.codeHash;
    if (!valid) {
      await store.incrementOtpAttempts(email);
      return fail(res, new Error("Invalid verification code"), 400);
    }

    await store.deleteOtp(email);
    let user = await store.findUserByEmail(email);
    if (user) {
      user = await store.updateUser(user.id, {
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
    }

    if (!user) return ok(res, { verified: true });

    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    return ok(res, { verified: true, token, user: publicUser(user) });
  } catch (error) {
    return fail(res, error);
  }
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  return ok(res, { user: publicUser(req.user!) });
});

authRouter.post("/demo-login", async (req, res) => {
  try {
    const body = z.object({ role: z.enum(["brand", "creator"]) }).parse(req.body);
    const email = body.role === "brand" ? "neha@theloom.in" : "aarohi@orbitly.app";
    const name = body.role === "brand" ? "Neha Kapoor" : "Aarohi Mehta";
    let user = await store.findUserByEmail(email);

    if (!user) {
      const now = new Date().toISOString();
      user = {
        id: nanoid(),
        name,
        email,
        passwordHash: await hashPassword("orbitly2025"),
        role: body.role,
        emailVerified: true,
        onboardingDone: true,
        onboardingStep: 0,
        onboardingPhase: "role",
        profile:
          body.role === "brand"
            ? { company: "The Loom", industry: "Fashion & apparel" }
            : { handle: "@aarohi.edits", city: "Mumbai" },
        createdAt: now,
        updatedAt: now,
      };
      await store.createUser(user);
      await store.ensurePrefs(user.id, { likedCreatorIds: [2] });

      if (body.role === "brand") {
        await store.claimSystemMessages(user.id);
      } else {
        await store.claimSystemWork(user.id);
        await store.claimSystemTransactions(user.id);
      }
    } else {
      user = await store.updateUser(user.id, {
        onboardingDone: true,
        emailVerified: true,
        role: body.role,
        updatedAt: new Date().toISOString(),
      });
    }

    if (!user) return fail(res, new Error("Unable to create demo user"), 500);

    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    return ok(res, { token, user: publicUser(user) });
  } catch (error) {
    return fail(res, error);
  }
});
