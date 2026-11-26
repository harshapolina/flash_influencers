import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken, type ApiUser } from "../lib/api";
import type { Booking, Creator, ExploreFilters, OnboardingRole } from "../types";

const defaultFilters: ExploreFilters = {
  category: "all",
  city: "All",
  minFollowers: 10000,
  maxFollowers: 500000,
  availableOnly: false,
  niche: "For you",
  sort: "match",
  savedOnly: false,
};

type AppState = {
  bootstrapping: boolean;
  user: ApiUser | null;
  onboardingDone: boolean;
  role: OnboardingRole;
  likedIds: number[];
  savedIds: number[];
  savedCampaignIds: string[];
  appliedCampaignIds: string[];
  bookings: Booking[];
  filters: ExploreFilters;
  creatorsCache: Creator[];
  apiOnline: boolean;
};

type AppStoreValue = {
  state: AppState;
  completeOnboarding: (role: OnboardingRole, profile?: Record<string, unknown>) => Promise<void>;
  demoEnter: (role: OnboardingRole) => Promise<void>;
  login: (email: string, password: string, role?: OnboardingRole) => Promise<ApiUser>;
  googleLogin: (idToken: string, role?: OnboardingRole) => Promise<ApiUser | { needsRole: true; email: string; name: string }>;
  resetSession: () => void;
  setUser: (user: ApiUser | null, token?: string | null) => void;
  toggleLike: (id: number) => Promise<void>;
  toggleSaveCreator: (id: number) => Promise<void>;
  toggleSaveCampaign: (id: string) => Promise<void>;
  applyCampaign: (id: string) => Promise<{
    applied: boolean;
    accepted?: boolean;
    appliedCampaignIds: string[];
    threadId?: string;
  }>;
  syncCampaignPrefs: (prefs: {
    savedCampaignIds?: string[];
    appliedCampaignIds?: string[];
  }) => void;
  setFilters: (filters: Partial<ExploreFilters>) => void;
  clearFilters: () => void;
  addBooking: (input: {
    creatorId: number;
    deliverable: string;
    price: number;
    date: string;
    time?: string;
    location: string;
    mode?: "instant" | "schedule";
    bookingType?: import("../types").BookingType;
    brief?: string;
    multiplier?: number;
  }) => Promise<Booking>;
  updateBookingStatus: (
    id: string,
    status: "accepted" | "rejected" | "completed",
  ) => Promise<Booking>;
  issueBookingStartOtp: (id: string) => Promise<{ booking: Booking; code: string; expiresAt: string }>;
  verifyBookingStart: (id: string, code: string) => Promise<Booking>;
  refreshBookings: () => Promise<Booking[]>;
  filterCreators: (query: string) => Creator[];
  refreshCreators: (query?: string, filterOverride?: Partial<ExploreFilters>) => Promise<Creator[]>;
  refreshSession: () => Promise<void>;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    bootstrapping: true,
    user: null,
    onboardingDone: false,
    role: "brand",
    likedIds: [],
    savedIds: [],
    savedCampaignIds: [],
    appliedCampaignIds: [],
    bookings: [],
    filters: defaultFilters,
    creatorsCache: [],
    apiOnline: false,
  });

  const setUser = useCallback((user: ApiUser | null, token?: string | null) => {
    if (token !== undefined) setToken(token);
    setState((s) => ({
      ...s,
      user,
      onboardingDone: user?.onboardingDone ?? false,
      role: (user?.role as OnboardingRole) || s.role,
    }));
  }, []);

  const refreshCreators = useCallback(
    async (query = "", filterOverride?: Partial<ExploreFilters>) => {
      try {
        const filters = { ...state.filters, ...filterOverride };
        const data = await api.listCreators({
          query,
          category: filters.category,
          city: filters.city,
          niche: filters.niche,
          minFollowers: filters.minFollowers,
          maxFollowers: filters.maxFollowers,
          availableOnly: filters.availableOnly,
          savedOnly: filters.savedOnly,
          sort: filters.sort,
        });
        setState((s) => ({
          ...s,
          filters: filterOverride ? { ...s.filters, ...filterOverride } : s.filters,
          creatorsCache: data.creators,
          likedIds: data.likedIds,
          savedIds: data.savedIds,
          apiOnline: true,
        }));
        return data.creators;
      } catch {
        setState((s) => ({ ...s, apiOnline: false }));
        return state.creatorsCache;
      }
    },
    [state.filters, state.creatorsCache],
  );

  const refreshSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState((s) => ({ ...s, bootstrapping: false, user: null, onboardingDone: false }));
      return;
    }
    try {
      const { user } = await api.me();
      setState((s) => ({
        ...s,
        bootstrapping: false,
        user,
        onboardingDone: user.onboardingDone,
        role: user.role,
        apiOnline: true,
      }));
      if (user.onboardingDone) {
        const [creators, bookings, campaigns] = await Promise.all([
          api.listCreators({
            query: "",
            category: "all",
            city: "All",
            niche: "For you",
            minFollowers: 0,
            maxFollowers: 10000000,
            availableOnly: false,
            savedOnly: false,
            sort: "match",
          }),
          api.listBookings().catch(() => ({ bookings: [] as Booking[] })),
          user.role === "creator"
            ? api.listCampaigns({}).catch(() => ({
                campaigns: [],
                savedCampaignIds: [] as string[],
                appliedCampaignIds: [] as string[],
              }))
            : Promise.resolve({
                campaigns: [],
                savedCampaignIds: [] as string[],
                appliedCampaignIds: [] as string[],
              }),
        ]);
        setState((s) => ({
          ...s,
          creatorsCache: creators.creators,
          likedIds: creators.likedIds,
          savedIds: creators.savedIds,
          bookings: bookings.bookings,
          savedCampaignIds: campaigns.savedCampaignIds || s.savedCampaignIds,
          appliedCampaignIds: campaigns.appliedCampaignIds || s.appliedCampaignIds,
        }));
      }
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      // Only clear session on auth failure — keep the user signed in through API blips.
      if (status === 401 || status === 403) {
        setToken(null);
        setState((s) => ({
          ...s,
          bootstrapping: false,
          user: null,
          onboardingDone: false,
          apiOnline: false,
        }));
        return;
      }
      setState((s) => ({
        ...s,
        bootstrapping: false,
        apiOnline: false,
      }));
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const syncCampaignPrefs = useCallback(
    (prefs: { savedCampaignIds?: string[]; appliedCampaignIds?: string[] }) => {
      setState((s) => {
        const nextSaved = prefs.savedCampaignIds ?? s.savedCampaignIds;
        const nextApplied = prefs.appliedCampaignIds ?? s.appliedCampaignIds;
        const sameSaved =
          nextSaved.length === s.savedCampaignIds.length &&
          nextSaved.every((id, i) => id === s.savedCampaignIds[i]);
        const sameApplied =
          nextApplied.length === s.appliedCampaignIds.length &&
          nextApplied.every((id, i) => id === s.appliedCampaignIds[i]);
        if (sameSaved && sameApplied) return s;
        return { ...s, savedCampaignIds: nextSaved, appliedCampaignIds: nextApplied };
      });
    },
    [],
  );

  const value = useMemo<AppStoreValue>(() => {
    return {
      state,
      setUser,
      refreshSession,
      refreshCreators,
      completeOnboarding: async (role, profile) => {
        const { user } = await api.completeOnboarding({ role, profile });
        setUser(user);
        await refreshSession();
      },
      demoEnter: async (role) => {
        const { token, user } = await api.demoLogin(role);
        setToken(token);
        setUser(user, token);
        await refreshSession();
      },
      login: async (email, password, role) => {
        const result = await api.login({ email, password, role });
        if (!result?.token || !result?.user) {
          throw new Error("Login failed. Please try again.");
        }
        setToken(result.token);
        setUser(result.user, result.token);
        await refreshSession();
        return result.user;
      },
      googleLogin: async (idToken, role) => {
        const result = await api.googleLogin({ idToken, role });
        if (result.needsRole) {
          return {
            needsRole: true as const,
            email: result.email || "",
            name: result.name || "",
          };
        }
        if (!result.token || !result.user) {
          throw new Error("Google sign-in failed");
        }
        setToken(result.token);
        setUser(result.user, result.token);
        await refreshSession();
        return result.user;
      },
      resetSession: () => {
        setToken(null);
        setState({
          bootstrapping: false,
          user: null,
          onboardingDone: false,
          role: "brand",
          likedIds: [],
          savedIds: [],
          savedCampaignIds: [],
          appliedCampaignIds: [],
          bookings: [],
          filters: defaultFilters,
          creatorsCache: [],
          apiOnline: state.apiOnline,
        });
      },
      toggleLike: async (id) => {
        const data = await api.likeCreator(id);
        setState((s) => ({ ...s, likedIds: data.likedIds }));
      },
      toggleSaveCreator: async (id) => {
        const data = await api.saveCreator(id);
        setState((s) => ({ ...s, savedIds: data.savedIds }));
      },
      toggleSaveCampaign: async (id) => {
        const data = await api.saveCampaign(id);
        setState((s) => ({ ...s, savedCampaignIds: data.savedCampaignIds }));
      },
      applyCampaign: async (id) => {
        const data = await api.applyCampaign(id);
        setState((s) => ({ ...s, appliedCampaignIds: data.appliedCampaignIds }));
        return data;
      },
      setFilters: (filters) => setState((s) => ({ ...s, filters: { ...s.filters, ...filters } })),
      clearFilters: () => setState((s) => ({ ...s, filters: { ...defaultFilters } })),
      addBooking: async (input) => {
        const { booking } = await api.createBooking(input);
        setState((s) => ({ ...s, bookings: [booking, ...s.bookings.filter((b) => b.id !== booking.id)] }));
        return booking;
      },
      syncCampaignPrefs,
      updateBookingStatus: async (id, status) => {
        const { booking } = await api.updateBookingStatus(id, status);
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((b) => (b.id === id ? booking : b)),
        }));
        return booking;
      },
      issueBookingStartOtp: async (id) => {
        const data = await api.issueBookingStartOtp(id);
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((b) => (b.id === id ? data.booking : b)),
        }));
        return data;
      },
      verifyBookingStart: async (id, code) => {
        const { booking } = await api.verifyBookingStart(id, code);
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((b) => (b.id === id ? booking : b)),
        }));
        return booking;
      },
      refreshBookings: async () => {
        try {
          const { bookings } = await api.listBookings();
          setState((s) => ({ ...s, bookings, apiOnline: true }));
          return bookings;
        } catch {
          setState((s) => ({ ...s, apiOnline: false }));
          return state.bookings;
        }
      },
      filterCreators: (query: string) => {
        const q = query.trim().toLowerCase();
        const { filters, creatorsCache, likedIds, savedIds } = state;
        let list = creatorsCache;
        if (q) {
          list = list.filter((c) =>
            `${c.name} ${c.city} ${c.niche} ${c.handle}`.toLowerCase().includes(q),
          );
        }
        if (filters.savedOnly) {
          list = list.filter((c) => likedIds.includes(c.id) || savedIds.includes(c.id));
        }
        if (filters.niche && filters.niche !== "For you") {
          const niche = filters.niche.toLowerCase();
          list = list.filter((c) => {
            if (niche === "nearby") return ["Mumbai", "Pune"].includes(c.city);
            if (niche === "available now") return c.available && (c.availability?.sameDay ?? true);
            return (
              c.tags.some((t) => t.toLowerCase() === niche) || c.niche.toLowerCase().includes(niche)
            );
          });
        }
        return list;
      },
    };
  }, [state, setUser, refreshSession, refreshCreators, syncCampaignPrefs]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

export { defaultFilters };
