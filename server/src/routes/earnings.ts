import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../db/store.js";
import type { Campaign, Transaction } from "../db/types.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const earningsRouter = Router();

earningsRouter.use(requireAuth);

function signedAmount(amount: string) {
  const negative = /[-−]/.test(amount);
  const value = Number(String(amount).replace(/[^\d.]/g, "")) || 0;
  return negative ? -value : value;
}

function enrichTransactions(txs: Transaction[], campaigns: Campaign[]) {
  return txs.map((tx) => {
    if (/bank transfer/i.test(tx.name)) {
      return {
        ...tx,
        brand: tx.brand || "Bank transfer",
        client: tx.client || "Your linked bank account",
        business: tx.business || "Withdrawal",
        campaignId: undefined,
      };
    }
    if (/orbitly/i.test(tx.name) || /fee/i.test(tx.status)) {
      return {
        ...tx,
        brand: tx.brand || "Orbitly",
        client: tx.client || "Orbitly",
        business: tx.business || tx.desc || "Platform fee",
        campaignId: undefined,
      };
    }

    const byId = tx.campaignId
      ? campaigns.find((campaign) => campaign.id === tx.campaignId)
      : undefined;
    const brandKey = (tx.brand || tx.name || "").toLowerCase();
    const byBrand = brandKey
      ? campaigns.find((campaign) => campaign.brand.toLowerCase() === brandKey)
      : undefined;
    const byBusiness = tx.business
      ? campaigns.find((campaign) => campaign.title.toLowerCase() === tx.business!.toLowerCase())
      : undefined;
    const byDesc = tx.desc
      ? campaigns.find((campaign) =>
          campaign.title.toLowerCase().includes(tx.desc.toLowerCase().split(" ")[0] || ""),
        )
      : undefined;
    const campaign = byId || byBusiness || byBrand || byDesc;

    return {
      ...tx,
      brand: tx.brand || campaign?.brand || tx.name,
      client: tx.client || (campaign ? `${campaign.brand} client team` : tx.name),
      business: tx.business || campaign?.title || tx.desc,
      campaignId: tx.campaignId || campaign?.id,
    };
  });
}

earningsRouter.get("/", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
  const [txs, campaigns] = await Promise.all([
    store.listTransactions(req.user!.id),
    store.listCampaigns(),
  ]);
  const enriched = enrichTransactions(txs, campaigns);
  const withdrawn = Boolean(req.user!.profile?.withdrawn);
  const now = new Date();
  let available = 0;
  let pending = 0;
  let paidToDate = 0;
  let earnedThisMonth = 0;
  for (const tx of enriched) {
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

  const monthTotals = Array.from({ length: 6 }, () => 0);
  for (const tx of enriched) {
    const value = Math.abs(signedAmount(tx.amount));
    if (!value) continue;
    const when = new Date(tx.createdAt);
    const monthsAgo =
      (now.getFullYear() - when.getFullYear()) * 12 + (now.getMonth() - when.getMonth());
    if (monthsAgo >= 0 && monthsAgo < 6) {
      monthTotals[5 - monthsAgo] += value;
    }
  }
  const peak = Math.max(...monthTotals, 1);
  const chart = monthTotals.map((total) =>
    total <= 0 ? 10 : Math.max(14, Math.min(100, Math.round((total / peak) * 100))),
  );

  return ok(res, {
    available: withdrawn ? 0 : available,
    earnedThisMonth,
    pending: Math.round(pending),
    paidToDate: Math.round(paidToDate),
    sixMonthTotal: Math.round(paidToDate),
    chart,
    transactions: enriched,
    withdrawn,
  });
});

earningsRouter.post("/withdraw", async (req: AuthedRequest, res) => {
  if (req.user!.role !== "creator") return fail(res, new Error("Creators only"), 403);
  if (req.user!.profile?.withdrawn) return fail(res, new Error("Withdrawal already requested"));
  const txs = await store.listTransactions(req.user!.id);
  let available = 0;
  for (const tx of txs) {
    const value = signedAmount(tx.amount);
    if (/pending|processing/i.test(tx.status)) continue;
    available += value;
  }
  available = Math.max(0, Math.round(available));
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
    brand: "Bank transfer",
    client: "Your linked bank account",
    business: "Withdrawal",
  });

  return ok(res, { ok: true, available: 0 });
});
