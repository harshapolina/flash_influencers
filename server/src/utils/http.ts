import type { Response } from "express";
import { ZodError } from "zod";

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json(data);
}

export function fail(res: Response, error: unknown, status = 400) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.flatten(),
    });
  }
  const message = error instanceof Error ? error.message : "Request failed";
  return res.status(status).json({ error: message });
}

function publicProfile(profile?: Record<string, unknown> | null) {
  if (!profile || typeof profile !== "object") return {};
  const social = profile.social;
  if (!social || typeof social !== "object") return profile;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(social as Record<string, unknown>)) {
    if (value && typeof value === "object") {
      const copy = { ...(value as Record<string, unknown>) };
      delete copy.accessToken;
      delete copy.tokenExpiresAt;
      cleaned[key] = copy;
    } else {
      cleaned[key] = value;
    }
  }
  return { ...profile, social: cleaned };
}

export function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  onboardingDone: boolean;
  onboardingStep: number;
  onboardingPhase: string;
  profile: Record<string, unknown>;
  avatarUrl?: string;
  authProvider?: string;
  googleId?: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    onboardingDone: user.onboardingDone,
    onboardingStep: user.onboardingStep,
    onboardingPhase: user.onboardingPhase,
    profile: publicProfile(user.profile),
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider || "password",
  };
}
