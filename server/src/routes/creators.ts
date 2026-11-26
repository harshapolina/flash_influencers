import { Router } from "express";
import { z } from "zod";
import { store } from "../db/store.js";
import { optionalAuth, requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok } from "../utils/http.js";

export const creatorsRouter = Router();

creatorsRouter.get("/", optionalAuth, async (req: AuthedRequest, res) => {
  try {
    const q = z
      .object({
        query: z.string().optional().default(""),
        category: z.enum(["all", "influencer", "ugc", "affiliate"]).optional().default("all"),
        city: z.string().optional().default("All"),
        niche: z.string().optional().default("For you"),
        minFollowers: z.coerce.number().optional().default(0),
        maxFollowers: z.coerce.number().optional().default(10_000_000),
        availableOnly: z
          .union([z.literal("true"), z.literal("false"), z.boolean()])
          .optional()
          .transform((v) => v === true || v === "true"),
        savedOnly: z
          .union([z.literal("true"), z.literal("false"), z.boolean()])
          .optional()
          .transform((v) => v === true || v === "true"),
        sort: z.enum(["match", "followers", "price"]).optional().default("match"),
      })
      .parse(req.query);

    const prefs = req.user ? await store.getPrefs(req.user.id) : null;
    let list = await store.listCreators();
    const search = q.query.trim().toLowerCase();

    list = list.filter((c) => {
      if (search && !`${c.name} ${c.city} ${c.niche} ${c.handle}`.toLowerCase().includes(search)) {
        return false;
      }
      if (q.savedOnly) {
        const ids = [...(prefs?.likedCreatorIds ?? []), ...(prefs?.savedCreatorIds ?? [])];
        if (!ids.includes(c.id)) return false;
      }
      if (q.category !== "all" && c.category !== q.category) return false;
      if (
        q.city &&
        q.city !== "All" &&
        q.niche !== "Nearby" &&
        (c.city || "").toLowerCase() !== q.city.toLowerCase()
      ) {
        return false;
      }
      if (q.availableOnly && !c.available) return false;
      if ((c.followersCount ?? 0) < q.minFollowers || (c.followersCount ?? 0) > q.maxFollowers) {
        return false;
      }
      if (q.niche && q.niche !== "For you") {
        const niche = q.niche.toLowerCase();
        if (niche === "nearby") return ["Mumbai", "Pune"].includes(c.city || "");
        if (niche === "available now") return c.available;
        const tags = Array.isArray(c.tags) ? c.tags : [];
        if (
          !tags.some((t) => String(t).toLowerCase() === niche) &&
          !(c.niche || "").toLowerCase().includes(niche)
        ) {
          return false;
        }
      }
      return true;
    });

    list.sort((a, b) => {
      if (q.sort === "followers") return b.followersCount - a.followersCount;
      if (q.sort === "price") return a.priceValue - b.priceValue;
      return b.match - a.match;
    });

    return ok(res, {
      creators: list,
      total: list.length,
      likedIds: prefs?.likedCreatorIds ?? [],
      savedIds: prefs?.savedCreatorIds ?? [],
    });
  } catch (error) {
    return fail(res, error);
  }
});

creatorsRouter.get("/:id", optionalAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const creator = await store.findCreator(id);
  if (!creator) return fail(res, new Error("Creator not found"), 404);
  const prefs = req.user ? await store.getPrefs(req.user.id) : null;
  return ok(res, {
    creator,
    liked: prefs?.likedCreatorIds.includes(id) ?? false,
    saved: prefs?.savedCreatorIds.includes(id) ?? false,
  });
});

creatorsRouter.post("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const prefs = await store.toggleArrayId(req.user!.id, "likedCreatorIds", id);
  return ok(res, { likedIds: prefs.likedCreatorIds, liked: prefs.likedCreatorIds.includes(id) });
});

creatorsRouter.post("/:id/save", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const prefs = await store.toggleArrayId(req.user!.id, "savedCreatorIds", id);
  return ok(res, { savedIds: prefs.savedCreatorIds, saved: prefs.savedCreatorIds.includes(id) });
});
