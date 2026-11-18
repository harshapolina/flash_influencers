import { Capacitor } from "@capacitor/core";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (Capacitor.isNativePlatform() ? "http://localhost:3001/api" : "/api");
const TOKEN_KEY = "orbitly.token";
const LOCAL_TOKEN = "local-demo";

export function isLocalDemoToken(token: string | null = getToken()) {
  return Boolean(token && token.startsWith("local-"));
}

export { LOCAL_TOKEN };

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

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  register: (body: { name: string; email: string; password: string; role: "brand" | "creator" }) =>
    request<{ token: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  demoLogin: (role: "brand" | "creator") =>
    request<{ token: string; user: ApiUser }>("/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ role }),
    }),
  sendOtp: (email: string) =>
    request<{ ok: boolean; expiresInSec: number; devCode?: string; message: string }>(
      "/auth/otp/send",
      { method: "POST", body: JSON.stringify({ email, purpose: "verify" }) },
    ),
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
  listCampaigns: (params: Record<string, string | boolean> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
    return request<any>(`/campaigns?${qs.toString()}`);
  },
  saveCampaign: (id: string) =>
    request<{ savedCampaignIds: string[]; saved: boolean }>(`/campaigns/${id}/save`, {
      method: "POST",
    }),
  applyCampaign: (id: string) =>
    request<{ applied: boolean; appliedCampaignIds: string[] }>(`/campaigns/${id}/apply`, {
      method: "POST",
    }),
  myWork: (bucket?: string) =>
    request<{ items: import("../types").WorkItem[]; counts: Record<string, number> }>(
      `/campaigns/work/mine${bucket ? `?bucket=${bucket}` : ""}`,
    ),
  createBooking: (body: {
    creatorId: number;
    deliverable: string;
    price?: number;
    date: string;
    location: string;
    multiplier?: number;
  }) =>
    request<{ booking: import("../types").Booking }>("/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listBookings: () => request<{ bookings: import("../types").Booking[] }>("/bookings"),
  listMessages: (tab = "all") =>
    request<{ messages: import("../types").InboxMessage[]; unreadCount: number }>(
      `/messages?tab=${tab}`,
    ),
  earnings: () => request<any>("/earnings"),
  withdraw: () => request<{ ok: boolean; available: number }>("/earnings/withdraw", { method: "POST" }),
};
