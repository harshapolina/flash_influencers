import { Router } from "express";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ok } from "../utils/http.js";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.get("/", async (req: AuthedRequest, res) => {
  const tab = String(req.query.tab || "all");
  const all = await store.listMessages(req.user!.id);
  const creators = await store.listCreators();
  let messages = all.map((m) => {
    const creator = creators.find((item) => item.id === m.peerCreatorId);
    return {
      id: m.id,
      creatorId: m.peerCreatorId,
      creatorName: creator?.name || "Creator",
      creatorImage: creator?.image || "",
      preview: m.preview,
      campaign: m.campaign,
      time: m.time,
      unread: m.unread,
      category: m.category,
    };
  });
  if (tab === "unread") messages = messages.filter((m) => m.unread > 0);
  if (tab === "campaigns") messages = messages.filter((m) => m.category === "campaigns");
  const unreadCount = all.reduce((sum, m) => sum + m.unread, 0);
  return ok(res, { messages, unreadCount });
});

messagesRouter.post("/:id/read", async (req: AuthedRequest, res) => {
  await store.markMessageRead(req.params.id, req.user!.id);
  return ok(res, { ok: true });
});
