import { OAuth2Client } from "google-auth-library";
import { config } from "../config.js";

const clients = (config.googleClientIds.length ? config.googleClientIds : []).map(
  (id) => new OAuth2Client(id),
);

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!clients.length) {
    throw new Error(
      "Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in server/.env",
    );
  }

  let lastError: unknown;
  for (const client of clients) {
    for (const audience of config.googleClientIds) {
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience,
        });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.sub) {
          throw new Error("Google token missing email");
        }
        return {
          sub: payload.sub,
          email: payload.email.toLowerCase(),
          emailVerified: Boolean(payload.email_verified),
          name: payload.name || payload.email.split("@")[0],
          picture: payload.picture,
        };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Invalid Google ID token");
}
