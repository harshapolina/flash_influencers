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
    profile: user.profile,
  };
}
