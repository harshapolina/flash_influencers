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
  applyCampaign: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ExploreFilters>) => void;
  clearFilters: () => void;
  addBooking: (input: {
    creatorId: number;
    deliverable: string;
    price: number;
    date: string;
    location: string;
    multiplier?: number;
  }) => Promise<Booking>;
  filterCreators: (query: string) => Creator[];
  refreshCreators: (query?: string) => Promise<Creator[]>;
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
    async (query = "") => {
      try {
        const { filters } = state;
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
        const [creators, bookings] = await Promise.all([
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
          user.role === "brand" ? api.listBookings() : Promise.resolve({ bookings: [] }),
        ]);
        setState((s) => ({
          ...s,
          creatorsCache: creators.creators,
          likedIds: creators.likedIds,
          savedIds: creators.savedIds,
          bookings: bookings.bookings,
        }));
      }
    } catch {
      setToken(null);
      setState((s) => ({
        ...s,
        bootstrapping: false,
        user: null,
        onboardingDone: false,
        apiOnline: false,
      }));
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

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
        const { token, user } = await api.login({ email, password, role });
        setToken(token);
        setUser(user, token);
        await refreshSession();
        return user;
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
      },
      setFilters: (filters) => setState((s) => ({ ...s, filters: { ...s.filters, ...filters } })),
      clearFilters: () => setState((s) => ({ ...s, filters: { ...defaultFilters } })),
      addBooking: async (input) => {
        const { booking } = await api.createBooking(input);
        setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
        return booking;
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
            if (niche === "available now") return c.available;
            return (
              c.tags.some((t) => t.toLowerCase() === niche) || c.niche.toLowerCase().includes(niche)
            );
          });
        }
        return list;
      },
    };
  }, [state, setUser, refreshSession, refreshCreators]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

export { defaultFilters };
