import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

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
