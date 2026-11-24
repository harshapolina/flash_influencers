import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const earningsRouter = Router();

earningsRouter.use(requireAuth);

function signedAmount(amount: string) {
  const negative = /[-−]/.test(amount);
  const value = Number(String(amount).replace(/[^\d.]/g, "")) || 0;
  return negative ? -value : value;
}

earningsRouter.get("/", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
  const txs = await store.listTransactions(req.user!.id);
  const withdrawn = Boolean(req.user!.profile.withdrawn);
  const now = new Date();
  let available = 0;
  let pending = 0;
  let paidToDate = 0;
  let earnedThisMonth = 0;
  for (const tx of txs) {
    const value = signedAmount(tx.amount);
    const when = new Date(tx.createdAt);
    const thisMonth = when.getMonth() === now.getMonth() && when.getFullYear() === now.getFullYear();
    if (/pending|processing/i.test(tx.status)) pending += Math.abs(value);
    else if (value > 0) {
      paidToDate += value;
      available += value;
      if (thisMonth) earnedThisMonth += value;
    } else {
      available += value;
    }
  }
  available = Math.max(0, Math.round(available));
  const chart = txs.slice(0, 6).map((tx) => Math.min(100, Math.round(Math.abs(signedAmount(tx.amount)) / 500)));
  return ok(res, {
    available: withdrawn ? 0 : available,
    earnedThisMonth,
    pending: Math.round(pending),
    paidToDate: Math.round(paidToDate),
    sixMonthTotal: Math.round(paidToDate),
    chart: chart.length ? chart : [0],
    transactions: txs,
    withdrawn,
  });
});

earningsRouter.post("/withdraw", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
  if (req.user!.profile.withdrawn) return fail(res, new Error("Withdrawal already requested"));
  const txs = await store.listTransactions(req.user!.id);
  const available = Math.max(
    0,
    Math.round(txs.reduce((sum, tx) => sum + signedAmount(tx.amount), 0)),
  );
  if (available <= 0) return fail(res, new Error("Nothing available to withdraw"));

  await store.updateUser(req.user!.id, {
    profile: { ...req.user!.profile, withdrawn: true },
    updatedAt: new Date().toISOString(),
  });

  await store.createTransaction({
    id: nanoid(),
    creatorUserId: req.user!.id,
    name: "Bank transfer",
    desc: "Withdrawal request",
    amount: `−₹${available.toLocaleString("en-IN")}`,
    status: "Pending",
    createdAt: new Date().toISOString(),
  });

  return ok(res, { ok: true, available: 0 });
});
