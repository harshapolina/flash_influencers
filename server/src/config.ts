import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || "orbitly-dev-secret-change-in-prod",
  mongoUri: process.env.MONGODB_URI || "",
  otpTtlMs: 5 * 60 * 1000,
  platformFeeRate: 0.08,
  isDev: process.env.NODE_ENV !== "production",
};
