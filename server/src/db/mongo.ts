import mongoose from "mongoose";
import { config } from "../config.js";

export async function connectMongo() {
  const uris = [config.mongoUri, process.env.MONGODB_FALLBACK_URI].filter(
    (u): u is string => Boolean(u),
  );

  if (!uris.length) {
    throw new Error("MONGODB_URI is missing. Set it in server/.env");
  }

  mongoose.set("strictQuery", true);

  let lastError: unknown;
  for (const uri of uris) {
    const label = uri.includes("mongodb+srv") ? "Atlas" : "local";
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log(`MongoDB connected (${label}): ${mongoose.connection.name}`);
      return;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`MongoDB ${label} connect failed: ${message}`);
      try {
        await mongoose.disconnect();
      } catch {
        /* ignore */
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to connect to MongoDB");
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
