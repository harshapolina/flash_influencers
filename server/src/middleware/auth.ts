import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/crypto.js";
import { store } from "../db/store.js";
import type { User } from "../db/types.js";

export type AuthedRequest = Request & { user?: User };

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = header.slice(7);
    const payload = await verifyToken(token);
    const user = await store.findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  verifyToken(header.slice(7))
    .then(async (payload) => {
      req.user = (await store.findUserById(payload.sub)) ?? undefined;
      next();
    })
    .catch(() => next());
}
