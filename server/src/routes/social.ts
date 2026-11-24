import { Router } from "express";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { config } from "../config.js";
import { store } from "../db/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { fail, ok, publicUser } from "../utils/http.js";

const stateSecret = new TextEncoder().encode(config.jwtSecret);

export const socialRouter = Router();

type TopPost = {
  title: string;
  url: string;
  thumbnail?: string;
  views?: number;
};

type SocialAccount = {
  platform: "instagram" | "youtube";
  handle: string;
  name: string;
  avatar?: string;
  url: string;
  followers?: number;
  following?: number;
  posts?: number;
  views?: number;
  viewRate?: number;
  topPosts: TopPost[];
  connectedAt: string;
  accessToken?: string;
  tokenExpiresAt?: string;
};

function cleanHandle(value: string) {
  return value.trim().replace(/^@/, "").replace(/\/+$/, "").split("/").filter(Boolean).pop() || "";
}

function compactRate(views?: number, followers?: number) {
  if (!views || !followers) return undefined;
  return Math.round((views / followers) * 1000) / 10;
}

function parseCompact(text?: string) {
  if (!text) return undefined;
  const value = Number(text.replace(/,/g, "").replace(/[^\d.]/g, ""));
  if (!value) return undefined;
  if (/billion/i.test(text)) return Math.round(value * 1_000_000_000);
  if (/million/i.test(text)) return Math.round(value * 1_000_000);
  if (/thousand/i.test(text)) return Math.round(value * 1_000);
  if (/\b\d+(\.\d+)?\s*b\b/i.test(text)) return Math.round(value * 1_000_000_000);
  if (/\b\d+(\.\d+)?\s*m\b/i.test(text)) return Math.round(value * 1_000_000);
  if (/\b\d+(\.\d+)?\s*k\b/i.test(text)) return Math.round(value * 1_000);
  return Math.round(value);
}

async function connectYouTube(handle: string): Promise<SocialAccount> {
  const response = await fetch(`https://www.youtube.com/@${encodeURIComponent(handle)}`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en" },
  });
  if (!response.ok) throw new Error("YouTube channel not found");
  const html = await response.text();
  const pick = (pattern: RegExp) => (html.match(pattern) || [])[1];
  const id = pick(/itemprop="identifier" content="([^"]+)"/);
  const name = pick(/itemprop="name" content="([^"]+)"/);
  if (!id || !name) throw new Error("YouTube channel not found");
  const followers = parseCompact(
    pick(/"subscriberCountText":\{"simpleText":"([^"]+)"/) ||
      pick(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/),
  );
  const avatar = pick(/itemprop="thumbnailUrl" href="([^"]+)"/);
  const topPosts: TopPost[] = [];
  try {
    const rss = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    if (rss.ok) {
      const xml = await rss.text();
      for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
        if (topPosts.length >= 3) break;
        const block = match[1];
        const title = (block.match(/<title>([^<]+)<\/title>/) || [])[1];
        const url = (block.match(/<link rel="alternate" href="([^"]+)"/) || [])[1];
        const views = Number((block.match(/<media:statistics views="(\d+)"/) || [])[1]) || undefined;
        const thumbnail = (block.match(/<media:thumbnail url="([^"]+)"/) || [])[1];
        if (title && url) topPosts.push({ title, url, views, thumbnail });
      }
    }
  } catch {
    // Recent videos are optional. The channel itself is already confirmed.
  }
  const sampled = topPosts.map((post) => post.views || 0).filter(Boolean);
  const avgViews = sampled.length
    ? Math.round(sampled.reduce((sum, value) => sum + value, 0) / sampled.length)
    : undefined;
  return {
    platform: "youtube",
    handle: `@${handle}`,
    name,
    avatar,
    url: `https://www.youtube.com/channel/${id}`,
    followers,
    posts: topPosts.length || undefined,
    views: avgViews,
    viewRate: compactRate(avgViews, followers),
    topPosts,
    connectedAt: new Date().toISOString(),
  };
}

function instagramReady() {
  return Boolean(config.instagram.appId && config.instagram.appSecret && config.instagram.configId);
}

async function signInstagramState(userId: string) {
  return new SignJWT({ purpose: "instagram" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(stateSecret);
}

async function readInstagramState(state: string) {
  const { payload } = await jwtVerify(state, stateSecret);
  if (payload.purpose !== "instagram" || !payload.sub) throw new Error("Instagram login expired. Try again.");
  return payload.sub;
}

async function instagramPost(url: string, body: URLSearchParams) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, any>;
  if (!response.ok) {
    throw new Error(data.error_message || data.error?.message || "Instagram did not approve the connection.");
  }
  return data;
}

async function instagramGet(url: string) {
  const response = await fetch(url);
  const data = (await response.json().catch(() => ({}))) as Record<string, any>;
  if (!response.ok) {
    throw new Error(data.error?.message || "Instagram did not return this account.");
  }
  return data;
}

async function accountFromUnifiedToken(accessToken: string): Promise<SocialAccount> {
  const assigned = await instagramGet(
    `https://graph.facebook.com/v21.0/me/assigned_instagram_accounts?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`,
  );
  const account = (Array.isArray(assigned.data) ? assigned.data[0] : null) as Record<string, any> | null;
  if (!account?.id) throw new Error("Instagram did not share an account. Approve the Instagram account on the Meta screen.");
  const igId = String(account.id);
  const media = await instagramGet(
    `https://graph.facebook.com/v21.0/${igId}/media?fields=id,caption,media_type,thumbnail_url,media_url,permalink&limit=6&access_token=${encodeURIComponent(accessToken)}`,
  ).catch(() => ({ data: [] }));
  const items = Array.isArray(media.data) ? media.data : [];
  const topPosts: TopPost[] = items.slice(0, 3).map((item: Record<string, any>) => ({
    title: String(item.caption || "Post").slice(0, 80),
    url: String(item.permalink || `https://www.instagram.com/${account.username}/`),
    thumbnail: String(item.thumbnail_url || item.media_url || ""),
  }));
  const followers = Number(account.followers_count);
  const following = Number(account.follows_count);
  const posts = Number(account.media_count);
  const username = String(account.username || igId);
  return {
    platform: "instagram",
    handle: `@${username}`,
    name: String(account.name || username),
    avatar: account.profile_picture_url ? String(account.profile_picture_url) : undefined,
    url: `https://www.instagram.com/${username}/`,
    followers: Number.isFinite(followers) ? followers : undefined,
    following: Number.isFinite(following) ? following : undefined,
    posts: Number.isFinite(posts) ? posts : undefined,
    topPosts,
    connectedAt: new Date().toISOString(),
    accessToken,
  };
}

async function accountFromInstagramToken(accessToken: string, expiresIn?: number): Promise<SocialAccount> {
  const profile = await instagramGet(
    `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`,
  );
  const username = String(profile.username || "");
  if (!username) throw new Error("Instagram did not return this account.");
  const media = await instagramGet(
    `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,thumbnail_url,media_url,permalink,like_count&limit=6&access_token=${encodeURIComponent(accessToken)}`,
  ).catch(() => ({ data: [] }));
  const items = Array.isArray(media.data) ? media.data : [];
  const topPosts: TopPost[] = [];
  for (const item of items.slice(0, 3)) {
    let views: number | undefined;
    if (item.media_type === "VIDEO" || item.media_type === "REELS") {
      const insights = await instagramGet(
        `https://graph.instagram.com/v21.0/${item.id}/insights?metric=views&access_token=${encodeURIComponent(accessToken)}`,
      ).catch(() => null);
      views = Number(insights?.data?.[0]?.values?.[0]?.value || insights?.data?.[0]?.total_value?.value) || undefined;
    }
    topPosts.push({
      title: String(item.caption || "Post").slice(0, 80),
      url: String(item.permalink || `https://www.instagram.com/${username}/`),
      thumbnail: String(item.thumbnail_url || item.media_url || ""),
      views,
    });
  }
  const followers = Number(profile.followers_count);
  const following = Number(profile.follows_count);
  const posts = Number(profile.media_count);
  const viewSamples = topPosts.map((post) => post.views || 0).filter(Boolean);
  const avgViews = viewSamples.length
    ? Math.round(viewSamples.reduce((sum, value) => sum + value, 0) / viewSamples.length)
    : undefined;
  return {
    platform: "instagram",
    handle: `@${username}`,
    name: String(profile.name || username),
    avatar: profile.profile_picture_url ? String(profile.profile_picture_url) : undefined,
    url: `https://www.instagram.com/${username}/`,
    followers: Number.isFinite(followers) ? followers : undefined,
    following: Number.isFinite(following) ? following : undefined,
    posts: Number.isFinite(posts) ? posts : undefined,
    views: avgViews,
    viewRate: compactRate(avgViews, Number.isFinite(followers) ? followers : undefined),
    topPosts,
    connectedAt: new Date().toISOString(),
    accessToken,
    tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
  };
}

function instagramResultPage(okConnect: boolean, message = "") {
  const payload = JSON.stringify({ type: "orbitly-instagram", ok: okConnect, error: message });
  return `<!doctype html><html><body style="font-family:sans-serif;padding:32px"><p>${
    okConnect ? "Instagram connected. You can close this window." : "Instagram was not connected."
  }</p><script>if(window.opener){window.opener.postMessage(${payload},"*");}setTimeout(()=>window.close(),400);</script></body></html>`;
}

async function saveSocial(userId: string, account: SocialAccount) {
  const current = await store.findUserById(userId);
  if (!current) throw new Error("User not found");
  const social = { ...((current.profile?.social as Record<string, SocialAccount>) || {}) };
  social[account.platform] = account;
  const fresh = await store.updateUser(userId, {
    profile: { ...(current.profile || {}), social },
    updatedAt: new Date().toISOString(),
  });
  return fresh;
}

socialRouter.get("/instagram/callback", async (req, res) => {
  const error = typeof req.query.error_description === "string" ? req.query.error_description : "";
  if (error || req.query.error) {
    return res.status(200).type("html").send(instagramResultPage(false, error || "You closed Instagram before approving."));
  }
  try {
    const code = String(req.query.code || "");
    const userId = await readInstagramState(String(req.query.state || ""));
    if (!code || !instagramReady()) throw new Error("Instagram login expired. Try again.");
    if (config.instagram.configId) {
      const exchanged = await instagramGet(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(config.instagram.appId)}&client_secret=${encodeURIComponent(config.instagram.appSecret)}&redirect_uri=${encodeURIComponent(config.instagram.redirectUri)}&code=${encodeURIComponent(code)}`,
      );
      const accessToken = String(exchanged.access_token || "");
      if (!accessToken) throw new Error("Instagram did not return a login token.");
      const account = await accountFromUnifiedToken(accessToken);
      await saveSocial(userId, account);
      return res.status(200).type("html").send(instagramResultPage(true));
    }
    const short = await instagramPost(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: config.instagram.appId,
        client_secret: config.instagram.appSecret,
        grant_type: "authorization_code",
        redirect_uri: config.instagram.redirectUri,
        code,
      }),
    );
    const shortToken = String(short.access_token || short.data?.[0]?.access_token || "");
    if (!shortToken) throw new Error("Instagram did not return a login token.");
    const long = (await instagramGet(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(config.instagram.appSecret)}&access_token=${encodeURIComponent(shortToken)}`,
    ).catch(() => ({ access_token: shortToken }))) as { access_token?: string; expires_in?: number };
    const accessToken = String(long.access_token || shortToken);
    const account = await accountFromInstagramToken(accessToken, Number(long.expires_in) || undefined);
    await saveSocial(userId, account);
    return res.status(200).type("html").send(instagramResultPage(true));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Instagram did not approve the connection.";
    const friendly = /personal|professional|business/i.test(message)
      ? "Instagram only shares followers from a professional account. In the Instagram app, switch this account to Professional, then approve Orbitly."
      : message;
    return res.status(200).type("html").send(instagramResultPage(false, friendly));
  }
});

socialRouter.use(requireAuth);

socialRouter.get("/instagram/start", async (req: AuthedRequest, res) => {
  if (!instagramReady()) {
    return fail(
      res,
      new Error(
        "Instagram login is not set up on this server yet. Add the Instagram app id and secret from Meta, then try again.",
      ),
      503,
    );
  }
  const state = await signInstagramState(req.user!.id);
  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.searchParams.set("client_id", config.instagram.appId);
  url.searchParams.set("config_id", config.instagram.configId);
  url.searchParams.set("redirect_uri", config.instagram.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("display", "popup");
  url.searchParams.set("prompt", "login");
  url.searchParams.set("state", state);
  return ok(res, { url: url.toString() });
});

socialRouter.get("/", async (req: AuthedRequest, res) => {
  const social = (req.user?.profile?.social as Record<string, SocialAccount>) || {};
  return ok(res, { accounts: Object.values(social) });
});

socialRouter.post("/connect", async (req: AuthedRequest, res) => {
  try {
    const body = z
      .object({
        platform: z.enum(["instagram", "youtube"]),
        handle: z.string().min(2).max(80),
      })
      .parse(req.body);
    if (body.platform === "instagram") {
      return fail(res, new Error("Instagram connects through Instagram’s own login. Tap Continue with Instagram."));
    }
    const handle = cleanHandle(body.handle);
    if (!/^[A-Za-z0-9._]+$/.test(handle)) {
      return fail(res, new Error("Use the public username only, without spaces."));
    }
    const account = await connectYouTube(handle);
    const user = await saveSocial(req.user!.id, account);
    return ok(res, { account, user: publicUser(user!) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not connect that account";
    return fail(res, new Error(message.includes("not found") ? message : "That account could not be confirmed. Check the username and try again."));
  }
});

socialRouter.delete("/:platform", async (req: AuthedRequest, res) => {
  try {
    const platform = req.params.platform;
    if (platform !== "instagram" && platform !== "youtube") {
      return fail(res, new Error("Unknown platform"));
    }
    const current = await store.findUserById(req.user!.id);
    if (!current) return fail(res, new Error("User not found"), 404);
    const social = { ...((current.profile?.social as Record<string, SocialAccount>) || {}) };
    delete social[platform];
    const user = await store.updateUser(req.user!.id, {
      profile: { ...(current.profile || {}), social },
      updatedAt: new Date().toISOString(),
    });
    return ok(res, { user: publicUser(user!) });
  } catch (error) {
    return fail(res, error);
  }
});
