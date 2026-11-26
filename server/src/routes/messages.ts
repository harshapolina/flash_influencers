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
      creatorName: m.peerName || creator?.name || "Creator",
      creatorImage: m.peerImage || creator?.image || "",
      peerUserId: m.peerUserId,
      preview: m.preview,
      campaign: m.campaign,
      time: m.time,
      unread: m.unread,
      category: m.category,
      threadId: m.threadId,
      bookingId: m.bookingId,
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

messagesRouter.get("/thread/:threadId", async (req: AuthedRequest, res) => {
  try {
    const threadId = req.params.threadId;
    const inbox = await store.findMessageByThread(req.user!.id, threadId);
    if (!inbox) return fail(res, new Error("Thread not found"), 404);

    const chat = await store.listChatMessages(threadId);
    await store.markMessageRead(inbox.id, req.user!.id);

    const peer =
      inbox.peerUserId != null ? await store.findUserById(inbox.peerUserId) : null;

    return ok(res, {
      threadId,
      bookingId: inbox.bookingId,
      campaign: inbox.campaign,
      peer: {
        id: inbox.peerUserId,
        name: inbox.peerName || peer?.name || "Brand",
        image: inbox.peerImage || "",
      },
      messages: chat.map((m) => ({
        id: m.id,
        senderUserId: m.senderUserId,
        text: m.text,
        createdAt: m.createdAt,
        mine: m.senderUserId === req.user!.id,
      })),
    });
  } catch (error) {
    return fail(res, error);
  }
});

messagesRouter.post("/thread/:threadId/send", async (req: AuthedRequest, res) => {
  try {
    const threadId = req.params.threadId;
    const body = z.object({ text: z.string().min(1).max(2000) }).parse(req.body);
    const inbox = await store.findMessageByThread(req.user!.id, threadId);
    if (!inbox) return fail(res, new Error("Thread not found"), 404);

    const createdAt = new Date().toISOString();
    const message = await store.createChatMessage({
      id: nanoid(),
      threadId,
      senderUserId: req.user!.id,
      text: body.text.trim(),
      createdAt,
    });

    await store.updateMessage(inbox.id, {
      preview: body.text.trim().slice(0, 120),
      time: "now",
      unread: 0,
    });

    if (inbox.peerUserId) {
      const peerInbox = await store.findMessageByThread(inbox.peerUserId, threadId);
      if (peerInbox) {
        await store.updateMessage(peerInbox.id, {
          preview: body.text.trim().slice(0, 120),
          time: "now",
          unread: (peerInbox.unread || 0) + 1,
        });
      } else {
        await store.createMessage({
          id: nanoid(),
          userId: inbox.peerUserId,
          peerUserId: req.user!.id,
          peerName: req.user!.name,
          peerImage: req.user!.avatarUrl || "",
          preview: body.text.trim().slice(0, 120),
          campaign: inbox.campaign,
          time: "now",
          unread: 1,
          category: "campaigns",
          threadId,
          bookingId: inbox.bookingId,
        });
      }
    }

    return ok(res, {
      message: {
        id: message.id,
        senderUserId: message.senderUserId,
        text: message.text,
        createdAt: message.createdAt,
        mine: true,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
});
