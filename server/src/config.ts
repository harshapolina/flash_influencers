import "dotenv/config";

function splitIds(value?: string) {
  return (value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || "orbitly-dev-secret-change-in-prod",
  mongoUri: process.env.MONGODB_URI || "",
  otpTtlMs: 5 * 60 * 1000,
  platformFeeRate: 0.08,
  isDev: process.env.NODE_ENV !== "production",
  googleClientIds: splitIds(
    process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || "",
  ),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
  },
  instagram: {
    appId: process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "",
    appSecret: process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "",
    configId: process.env.INSTAGRAM_CONFIG_ID || "",
    redirectUri:
      process.env.INSTAGRAM_REDIRECT_URI ||
      `http://localhost:${Number(process.env.PORT || 3001)}/api/social/instagram/callback`,
  },
};
