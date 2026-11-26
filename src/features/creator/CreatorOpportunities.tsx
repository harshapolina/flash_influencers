import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import { StatusBar } from "../../components/ui/StatusBar";
import type { Campaign } from "../../types";
import { CreatorBriefSheet } from "./CreatorBriefSheet";
import {
  OpportunityFilterSheet,
  type OpportunityFilters,
} from "./OpportunityFilterSheet";

const PILLS = ["For you", "UGC", "Fashion", "Affiliate", "Nearby"] as const;
const SORT_OPTIONS = [
  ["recommended", "Recommended"],
  ["newest", "Newest"],
  ["pay", "Highest pay"],
] as const;

const defaultFilters: OpportunityFilters = {
  location: "All",
  mode: "",
  minPay: 0,
  sort: "recommended",
};

export function CreatorOpportunitiesScreen({
  onChat,
  initialCampaignId,
  onInitialCampaignConsumed,
}: {
  onChat?: (threadId: string) => void;
  initialCampaignId?: string | null;
  onInitialCampaignConsumed?: () => void;
}) {
  const { state, toggleSaveCampaign, syncCampaignPrefs } = useAppStore();
  const [query, setQuery] = useState("");
  const [pill, setPill] = useState<(typeof PILLS)[number]>("For you");
  const [savedOnly, setSavedOnly] = useState(false);
  const [filters, setFilters] = useState<OpportunityFilters>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [list, setList] = useState<Campaign[]>([]);
  const [counts, setCounts] = useState({ total: 0, saved: 0, applied: 0, booked: 0 });
  const [brief, setBrief] = useState<Campaign | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadError("");
    api
      .listCampaigns({
        query,
        pill,
        savedOnly,
        location: filters.location === "All" ? "" : filters.location,
        mode: filters.mode,
        minPay: filters.minPay,
        sort: filters.sort,
      })
      .then((data) => {
        if (!alive) return;
        const campaigns = data.campaigns || [];
        setList(campaigns);
        if (data.counts) {
          setCounts({
            total: data.counts.total || campaigns.length || 0,
            saved: data.counts.saved || 0,
            applied: data.counts.applied || 0,
            booked: data.counts.booked || 0,
          });
        }
        syncCampaignPrefs({
          savedCampaignIds: data.savedCampaignIds,
          appliedCampaignIds: data.appliedCampaignIds,
        });
        if (initialCampaignId) {
          const match = campaigns.find((c) => c.id === initialCampaignId);
          if (match) setBrief(match);
          onInitialCampaignConsumed?.();
        }
      })
      .catch(() => {
        if (!alive) return;
        setLoadError("Couldn’t load opportunities. Pull to refresh or try again.");
      });
    return () => {
      alive = false;
    };
  }, [query, pill, savedOnly, filters, syncCampaignPrefs, initialCampaignId, onInitialCampaignConsumed]);

  const sortLabel =
    filters.sort === "pay" ? "Highest pay" : filters.sort === "newest" ? "Newest" : "Recommended";

  return (
    <div className="screen creator-opportunities-screen">
      <StatusBar />
      <header className="creator-section-head">
        <div>
          <small>DISCOVER</small>
          <h1>Opportunities</h1>
        </div>
        <button
          className={`round-button ${savedOnly ? "active" : ""}`}
          type="button"
          onClick={() => setSavedOnly((v) => !v)}
        >
          <Icon name="bookmark" size={18} fill={savedOnly} />
        </button>
      </header>
      <div className="mobile-search creator-search">
        <Icon name="search" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brands or campaigns"
        />
        <button type="button" onClick={() => setFilterOpen(true)}>
          <Icon name="filter" size={17} />
        </button>
      </div>
      <div className="pills creator-pills">
        {PILLS.map((item) => (
          <button
            key={item}
            type="button"
            className={pill === item ? "active" : ""}
            onClick={() => setPill(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="creator-ai-match-banner">
        <span>
          <Icon name="sparkles" size={20} />
        </span>
        <div>
          <small>ORBITLY AI</small>
          <strong>{list.length} matches</strong>
          <p>
            {counts.booked
              ? `${counts.booked} brand booking${counts.booked === 1 ? "" : "s"} · ${state.savedCampaignIds.length} saved`
              : `Based on your audience · ${state.savedCampaignIds.length} saved`}
          </p>
        </div>
        <button
          type="button"
          aria-label="Show AI matches"
          onClick={() => {
            setPill("For you");
            setSavedOnly(false);
            setFilters((f) => ({ ...f, sort: "recommended" }));
            setSortOpen(false);
            setActionNotice("Showing your best AI matches first.");
            feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <Icon name="arrow" size={16} />
        </button>
      </section>
      <div className="creator-results-line">
        <strong>Best matches</strong>
        <div className="sort-dropdown">
          <button type="button" className="sort-dropdown-trigger" onClick={() => setSortOpen((v) => !v)}>
            {sortLabel} <Icon name="chevron" size={12} />
          </button>
          {sortOpen && (
            <div className="sort-dropdown-menu">
              {SORT_OPTIONS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={filters.sort === id ? "active" : ""}
                  onClick={() => {
                    setFilters((f) => ({ ...f, sort: id }));
                    setSortOpen(false);
                    setActionNotice(`Sorted by ${label}.`);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {(loadError || actionNotice) && (
        <p className={`work-inline-notice ${loadError ? "is-error" : ""}`}>
          {loadError || actionNotice}
        </p>
      )}
      <div className="opportunity-feed" ref={feedRef}>
        {list.map((campaign, index) => {
          const saved = state.savedCampaignIds.includes(campaign.id);
          const applied = state.appliedCampaignIds.includes(campaign.id);
          const isBooking = Boolean(campaign.bookingId);
          return (
            <article key={campaign.id}>
              <div className={`campaign-art ca-${index % 4}`}>
                <span className="campaign-brand-mark">{campaign.icon}</span>
                <span className="feed-match">
                  <Icon name="sparkles" size={10} />
                  {typeof campaign.match === "number" ? `${campaign.match}%` : "Open"}
                </span>
                <button
                  type="button"
                  aria-label={saved ? "Unsave campaign" : "Save campaign"}
                  onClick={() => {
                    void toggleSaveCampaign(campaign.id)
                      .then(() =>
                        setActionNotice(saved ? "Removed from saved." : "Saved to your list."),
                      )
                      .catch(() => setActionNotice("Couldn’t update saved campaigns."));
                  }}
                >
                  <Icon name="bookmark" size={16} fill={saved} />
                </button>
                <div className="campaign-shape s-one" />
                <div className="campaign-shape s-two" />
                <strong>{campaign.brand}</strong>
              </div>
              <div className="campaign-feed-copy">
                <span>
                  {campaign.brand} ·{" "}
                  {isBooking
                    ? campaign.bookingMode === "instant"
                      ? "INSTANT"
                      : "SCHEDULED"
                    : "VERIFIED"}
                </span>
                <h3>{campaign.title}</h3>
                <p>
                  <Icon name="camera" size={12} />
                  {campaign.type}
                  <i />
                  <Icon name="calendar" size={12} />
                  {isBooking ? "Due" : "Apply by"} {campaign.applyBy}
                </p>
                <div className="campaign-tags">
                  {(campaign.tags?.length
                    ? campaign.tags.slice(0, 3)
                    : ["Paid", "Usage: 3 months", campaign.location || "Remote"]
                  ).map((tag) => (
                    <b key={tag}>{tag}</b>
                  ))}
                </div>
                <footer>
                  <div>
                    <small>CREATOR PAY</small>
                    <strong>{campaign.pay}</strong>
                  </div>
                  <button type="button" className="campaign-open-btn" onClick={() => setBrief(campaign)}>
                    {applied && !isBooking
                      ? "Applied"
                      : isBooking
                        ? "View booking"
                        : "View brief"}
                    <Icon name="arrow" size={14} />
                  </button>
                </footer>
              </div>
            </article>
          );
        })}
        {brief && (
          <CreatorBriefSheet
            campaign={brief}
            onClose={() => setBrief(null)}
            onChat={onChat}
          />
        )}
        {!list.length && !loadError && (
          <div className="empty" style={{ padding: 40 }}>
            <h3>No opportunities</h3>
            <p>Try another filter or clear saved-only mode.</p>
          </div>
        )}
      </div>
      {filterOpen && (
        <OpportunityFilterSheet
          filters={filters}
          resultCount={list.length}
          onApply={(next) => {
            setFilters(next);
            setActionNotice("Filters applied.");
          }}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}
