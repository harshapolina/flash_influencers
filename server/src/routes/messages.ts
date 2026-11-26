import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

function threadKeyFor(userId: string, peerCreatorId: number) {
  return `${userId}:${peerCreatorId}`;
}

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

messagesRouter.get("/thread/:creatorId", async (req: AuthedRequest, res) => {
  try {
    const peerCreatorId = Number(req.params.creatorId);
    if (!Number.isFinite(peerCreatorId)) return fail(res, new Error("Invalid creator"), 400);
    const key = threadKeyFor(req.user!.id, peerCreatorId);
    const lines = await store.listChatLines(key);
    return ok(res, {
      lines: lines.map((line) => ({
        id: line.id,
        text: line.text,
        createdAt: line.createdAt,
        mine: line.senderUserId === req.user!.id,
      })),
    });
  } catch (error) {
    return fail(res, error);
  }
});

messagesRouter.post("/thread/:creatorId", async (req: AuthedRequest, res) => {
  try {
    const peerCreatorId = Number(req.params.creatorId);
    if (!Number.isFinite(peerCreatorId)) return fail(res, new Error("Invalid creator"), 400);
    const body = z.object({ text: z.string().trim().min(1).max(2000) }).parse(req.body);
    const key = threadKeyFor(req.user!.id, peerCreatorId);
    const line = await store.createChatLine({
      id: nanoid(),
      threadKey: key,
      senderUserId: req.user!.id,
      peerCreatorId,
      text: body.text,
      createdAt: new Date().toISOString(),
    });

    await store.upsertInboxPreview({
      userId: req.user!.id,
      peerCreatorId,
      preview: body.text,
      unread: 0,
      category: "general",
    });

    const creator = await store.findCreator(peerCreatorId);
    if (creator?.userId) {
      await store.upsertInboxPreview({
        userId: creator.userId,
        peerCreatorId,
        preview: body.text,
        campaign: req.user!.name || "Brand",
        unread: 1,
        category: "general",
      });
    }

    return ok(res, {
      line: {
        id: line.id,
        text: line.text,
        createdAt: line.createdAt,
        mine: true,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
});

messagesRouter.post("/:id/read", async (req: AuthedRequest, res) => {
  await store.markMessageRead(req.params.id, req.user!.id);
  return ok(res, { ok: true });
});
