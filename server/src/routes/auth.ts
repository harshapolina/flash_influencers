import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { config } from "../config.js";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { verifyGoogleIdToken } from "../services/googleAuth.js";
import { sendOtpEmail } from "../services/mail.js";
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
      authProvider: "password" as const,
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
      .object({
        email: z.string().email(),
        password: z.string().min(1),
        role: z.enum(["brand", "creator"]).optional(),
      })
      .parse(req.body);
    const user = await store.findUserByEmail(body.email.toLowerCase().trim());
    if (!user || !user.passwordHash) {
      return fail(res, new Error("Invalid email or password"), 401);
    }
    if (!(await verifyPassword(body.password, user.passwordHash))) {
      return fail(res, new Error("Invalid email or password"), 401);
    }
    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    return ok(res, { token, user: publicUser(user) });
  } catch (error) {
    return fail(res, error);
  }
});

authRouter.post("/google", async (req, res) => {
  try {
    const body = z
      .object({
        idToken: z.string().min(20),
        role: z.enum(["brand", "creator"]).optional(),
      })
      .parse(req.body);

    const profile = await verifyGoogleIdToken(body.idToken);
    if (!profile.emailVerified) {
      return fail(res, new Error("Google email is not verified"), 403);
    }

    let user =
      (await store.findUserByGoogleId(profile.sub)) ||
      (await store.findUserByEmail(profile.email));

    const now = new Date().toISOString();
    if (!user) {
      if (!body.role) {
        return ok(res, {
          needsRole: true,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        });
      }
      user = {
        id: nanoid(),
        name: profile.name,
        email: profile.email,
        passwordHash: "",
        googleId: profile.sub,
        avatarUrl: profile.picture,
        authProvider: "google",
        role: body.role,
        emailVerified: true,
        onboardingDone: false,
        onboardingStep: 0,
        onboardingPhase: "common",
        profile: {},
        createdAt: now,
        updatedAt: now,
      };
      await store.createUser(user);
      await store.ensurePrefs(user.id, {});
    } else {
      user = await store.updateUser(user.id, {
        googleId: profile.sub,
        avatarUrl: profile.picture || user.avatarUrl,
        name: user.name || profile.name,
        emailVerified: true,
        authProvider: user.authProvider === "password" ? "password" : "google",
        ...(body.role && !user.onboardingDone ? { role: body.role } : {}),
        updatedAt: now,
      });
    }

    if (!user) return fail(res, new Error("Unable to complete Google sign-in"), 500);
    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    return ok(res, { token, user: publicUser(user) });
  } catch (error) {
    return fail(res, error, 401);
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

    const mail = await sendOtpEmail(email, code, body.purpose);

    return ok(res, {
      ok: true,
      expiresInSec: Math.floor(config.otpTtlMs / 1000),
      message: mail.delivered
        ? `Verification code sent to ${email}`
        : `Verification code generated for ${email}. Configure SMTP to deliver email.`,
      delivered: mail.delivered,
      ...(config.isDev
        ? {
            previewUrl: mail.previewUrl,
            // In local/dev always return code when email transport is unavailable
            ...(!mail.delivered || process.env.OTP_EXPOSE_DEV_CODE === "true"
              ? { devCode: code }
              : {}),
          }
        : {}),
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
        authProvider: "password",
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

    if (body.role === "creator") {
      await store.linkCreatorUser(1, user.id);
    }

    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    return ok(res, { token, user: publicUser(user) });
  } catch (error) {
    return fail(res, error);
  }
});
