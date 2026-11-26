import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { connectMongo } from "./db/mongo.js";
import { buildSeed } from "./db/seed.js";
import { store } from "./db/store.js";
import { authRouter } from "./routes/auth.js";
import { bookingsRouter } from "./routes/bookings.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { creatorsRouter } from "./routes/creators.js";
import { earningsRouter } from "./routes/earnings.js";
import { messagesRouter } from "./routes/messages.js";
import { onboardingRouter } from "./routes/onboarding.js";
import { placesRouter } from "./routes/places.js";
import { socialRouter } from "./routes/social.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "orbitly-api",
    db: "mongodb",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/creators", creatorsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/earnings", earningsRouter);
app.use("/api/places", placesRouter);
app.use("/api/social", socialRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await connectMongo();
  const seed = buildSeed();
  const seeded = await store.seedIfEmpty(seed);
  if (seeded) console.log("MongoDB seeded with demo creators & campaigns");
  const synced = await store.syncCreatorAvailability(seed.creators);
  if (synced) console.log(`Synced availability prefs for ${synced} creators`);

  app.listen(config.port, () => {
    console.log(`Orbitly API listening on http://localhost:${config.port}`);
    if (config.smtp.user) console.log(`[mail] SMTP account configured`);
  });
}

start().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
