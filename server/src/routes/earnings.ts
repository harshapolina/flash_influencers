import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const earningsRouter = Router();

earningsRouter.use(requireAuth);

earningsRouter.get("/", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
  const txs = await store.listTransactions(req.user!.id);
  const withdrawn = Boolean(req.user!.profile.withdrawn);
  return ok(res, {
    available: withdrawn ? 0 : 84320,
    earnedThisMonth: 21400,
    pending: 18000,
    paidToDate: 142000,
    sixMonthTotal: 214000,
    chart: [35, 48, 41, 67, 58, 92],
    transactions: txs,
    withdrawn,
  });
});

earningsRouter.post("/withdraw", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
  if (req.user!.profile.withdrawn) return fail(res, new Error("Withdrawal already requested"));

  await store.updateUser(req.user!.id, {
    profile: { ...req.user!.profile, withdrawn: true },
    updatedAt: new Date().toISOString(),
  });

  await store.createTransaction({
    id: nanoid(),
    creatorUserId: req.user!.id,
    name: "Bank transfer",
    desc: "Withdrawal request",
    amount: "−₹84,320",
    status: "Pending",
    createdAt: new Date().toISOString(),
  });

  return ok(res, { ok: true, available: 0 });
});
