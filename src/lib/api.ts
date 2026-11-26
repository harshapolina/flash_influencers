import { Capacitor } from "@capacitor/core";

function resolveApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (Capacitor.isNativePlatform()) {
    // Android emulator → host machine loopback
    if (Capacitor.getPlatform() === "android") return "http://10.0.2.2:3001/api";
    // iOS simulator / USB with adb reverse: localhost works
    return "http://localhost:3001/api";
  }
  return "/api";
}

const API_BASE = resolveApiBase();
const TOKEN_KEY = "orbitly.token";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "brand" | "creator";
  emailVerified: boolean;
  onboardingDone: boolean;
  onboardingStep: number;
  onboardingPhase: "common" | "role";
  profile: Record<string, unknown>;
  avatarUrl?: string;
  authProvider?: string;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      "Cannot reach Orbitly API. Start the server (`npm --prefix server run dev`) and keep this device connected.",
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  register: (body: { name: string; email: string; password: string; role: "brand" | "creator" }) =>
    request<{ token: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string; role?: "brand" | "creator" }) =>
    request<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  googleLogin: (body: { idToken: string; role?: "brand" | "creator" }) =>
    request<{ token?: string; user?: ApiUser; needsRole?: boolean; email?: string; name?: string }>(
      "/auth/google",
      { method: "POST", body: JSON.stringify(body) },
    ),
  demoLogin: (role: "brand" | "creator") =>
    request<{ token: string; user: ApiUser }>("/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ role }),
    }),
  sendOtp: (email: string, purpose: "verify" | "login" = "verify") =>
    request<{
      ok: boolean;
      expiresInSec: number;
      message: string;
      delivered?: boolean;
      previewUrl?: string;
      devCode?: string;
    }>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ email, purpose }),
    }),
  verifyOtp: (email: string, code: string) =>
    request<{ verified: boolean; token?: string; user?: ApiUser }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  me: () => request<{ user: ApiUser }>("/auth/me"),
  saveOnboardingProgress: (body: Record<string, unknown>) =>
    request<{ user: ApiUser }>("/onboarding/progress", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  completeOnboarding: (body?: { role?: "brand" | "creator"; profile?: Record<string, unknown> }) =>
    request<{ user: ApiUser }>("/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(body || {}),
    }),
  listCreators: (params: Record<string, string | number | boolean>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
    return request<{
      creators: import("../types").Creator[];
      total: number;
      likedIds: number[];
      savedIds: number[];
    }>(`/creators?${qs.toString()}`);
  },
  likeCreator: (id: number) =>
    request<{ likedIds: number[]; liked: boolean }>(`/creators/${id}/like`, { method: "POST" }),
  saveCreator: (id: number) =>
    request<{ savedIds: number[]; saved: boolean }>(`/creators/${id}/save`, { method: "POST" }),
  listCampaigns: (params: Record<string, string | number | boolean> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
    return request<{
      campaigns: import("../types").Campaign[];
      savedCampaignIds?: string[];
      appliedCampaignIds?: string[];
      bookings?: import("../types").Booking[];
      counts?: Record<string, number>;
    }>(`/campaigns?${qs.toString()}`);
  },
  saveCampaign: (id: string) =>
    request<{ savedCampaignIds: string[]; saved: boolean }>(`/campaigns/${id}/save`, {
      method: "POST",
    }),
  applyCampaign: (id: string) =>
    request<{
      applied: boolean;
      accepted?: boolean;
      appliedCampaignIds: string[];
      threadId?: string;
    }>(`/campaigns/${id}/apply`, {
      method: "POST",
    }),
  myWork: (bucket?: string) =>
    request<{ items: import("../types").WorkItem[]; counts: Record<string, number> }>(
      `/campaigns/work/mine${bucket ? `?bucket=${bucket}` : ""}`,
    ),
  acceptWork: (id: string) =>
    request<{ item: import("../types").WorkItem }>(`/campaigns/work/${id}/accept`, {
      method: "POST",
    }),
  createBooking: (body: {
    creatorId: number;
    deliverable: string;
    price?: number;
    date: string;
    location: string;
    mode?: "instant" | "schedule";
    brief?: string;
    multiplier?: number;
  }) =>
    request<{ booking: import("../types").Booking }>("/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listBookings: () => request<{ bookings: import("../types").Booking[] }>("/bookings"),
  acceptBooking: (id: string) =>
    request<{ booking: import("../types").Booking; work?: import("../types").WorkItem }>(
      `/bookings/${id}/accept`,
      { method: "POST" },
    ),
  declineBooking: (id: string) =>
    request<{ booking: import("../types").Booking }>(`/bookings/${id}/decline`, {
      method: "POST",
    }),
  listMessages: (tab = "all") =>
    request<{ messages: import("../types").InboxMessage[]; unreadCount: number }>(
      `/messages?tab=${tab}`,
    ),
  markMessageRead: (id: string) =>
    request<{ ok: boolean }>(`/messages/${id}/read`, { method: "POST" }),
  getThread: (threadId: string) =>
    request<{
      threadId: string;
      bookingId?: string;
      campaign: string;
      peer: { id?: string; name: string; image: string };
      messages: import("../types").ChatLine[];
    }>(`/messages/thread/${threadId}`),
  sendThreadMessage: (threadId: string, text: string) =>
    request<{ message: import("../types").ChatLine }>(`/messages/thread/${threadId}/send`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  earnings: () => request<any>("/earnings"),
  withdraw: () => request<{ ok: boolean; available: number }>("/earnings/withdraw", { method: "POST" }),
  searchPlaces: (q: string) =>
    request<{ places: PlaceResult[] }>(`/places?q=${encodeURIComponent(q)}`),
  reversePlace: (lat: number, lon: number) =>
    request<{ place: PlaceResult }>(`/places/reverse?lat=${lat}&lon=${lon}`),
  instagramAuthUrl: () => request<{ url: string }>("/social/instagram/start"),
  connectSocial: (body: { platform: "instagram" | "youtube"; handle: string }) =>
    request<{ account: SocialAccount; user: ApiUser }>("/social/connect", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  disconnectSocial: (platform: "instagram" | "youtube") =>
    request<{ user: ApiUser }>(`/social/${platform}`, { method: "DELETE" }),
};

export type PlaceResult = {
  id: number;
  label: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
};

export type SocialAccount = {
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
  topPosts: { title: string; url: string; thumbnail?: string; views?: number }[];
  connectedAt: string;
};
