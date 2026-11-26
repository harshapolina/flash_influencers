import bcrypt from "bcryptjs";
import { createHash, randomInt } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { config } from "../config.js";

const secret = new TextEncoder().encode(config.jwtSecret);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashOtp(code: string) {
  return createHash("sha256").update(`${code}:${config.jwtSecret}`).digest("hex");
}

export function generateOtp() {
  return String(randomInt(100000, 999999));
}

/** Keep sessions alive ~5 weeks so the app does not ask for login every launch. */
const SESSION_TTL = "35d";

export async function signToken(payload: { sub: string; role: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; role: "brand" | "creator"; email: string };
}
