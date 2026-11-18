import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ok } from "../utils/http.js";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.get("/", async (req: AuthedRequest, res) => {
  const tab = String(req.query.tab || "all");
  const all = await store.listMessages(req.user!.id);
  let messages = all;
  if (tab === "unread") messages = all.filter((m) => m.unread > 0);
  if (tab === "campaigns") messages = all.filter((m) => m.category === "campaigns");
  const unreadCount = all.reduce((sum, m) => sum + m.unread, 0);
  return ok(res, { messages, unreadCount });
});

messagesRouter.post("/:id/read", async (req: AuthedRequest, res) => {
  await store.markMessageRead(req.params.id, req.user!.id);
  return ok(res, { ok: true });
});
