import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import { StatusBar } from "../../components/ui/StatusBar";
import type { Booking, Campaign } from "../../types";
import { CreatorBriefSheet } from "./CreatorBriefSheet";
import {
  OpportunityFilterSheet,
  type OpportunityFilters,
} from "./OpportunityFilterSheet";

type RequestStatus = "pending" | "accepted" | "declined" | "hidden";

type BrandRequestCard = {
  id: string;
  brand: string;
  mark: string;
  title: string;
  pay: string;
  copy: string;
  bookingId?: string;
  threadId?: string;
  isDemo?: boolean;
};

const DEMO_BRAND_REQUEST: BrandRequestCard = {
  id: "demo-loom",
  brand: "The Loom",
  mark: "TL",
  title: "Summer Edit · Paid collaboration",
  pay: "₹28K",
  copy: "The Loom invited you to create 1 Reel and 2 Stories for their new summer collection.",
  isDemo: true,
};

function bookingToRequest(booking: Booking): BrandRequestCard {
  const brand = booking.brandName || "Brand";
  const pay =
    typeof booking.price === "number" && booking.price > 0
      ? `₹${Math.round(booking.price / 1000)}K`
      : "Paid";
  return {
    id: booking.id,
    brand,
    mark: brand.slice(0, 2).toUpperCase(),
    title: `${booking.deliverable || "Collaboration"} · ${
      booking.mode === "instant" || booking.bookingType === "instant" ? "Instant" : "Scheduled"
    }`,
    pay,
    copy:
      booking.brief ||
      `${brand} invited you for ${booking.deliverable || "a collaboration"} on ${booking.date}${
        booking.location ? ` · ${booking.location}` : ""
      }.`,
    bookingId: booking.id,
    threadId: booking.threadId,
  };
}

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

function payValue(pay?: string) {
  return Number(String(pay || "").replace(/[^\d]/g, "")) || 0;
}

function sortCampaigns(campaigns: Campaign[], sort: OpportunityFilters["sort"]) {
  const next = [...campaigns];
  if (sort === "pay") {
    next.sort((a, b) => payValue(b.pay) - payValue(a.pay));
    return next;
  }
  if (sort === "newest") {
    next.sort((a, b) => {
      const aTime = Date.parse(String((a as { createdAt?: string }).createdAt || "")) || 0;
      const bTime = Date.parse(String((b as { createdAt?: string }).createdAt || "")) || 0;
      if (bTime !== aTime) return bTime - aTime;
      const aBook = a.bookingId ? 1 : 0;
      const bBook = b.bookingId ? 1 : 0;
      if (bBook !== aBook) return bBook - aBook;
      return String(b.id).localeCompare(String(a.id));
    });
    return next;
  }
  next.sort((a, b) => (b.match || 0) - (a.match || 0) || String(a.id).localeCompare(String(b.id)));
  return next;
}

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
  const [toast, setToast] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [brandRequest, setBrandRequest] = useState<BrandRequestCard | null>(DEMO_BRAND_REQUEST);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("pending");
  const [requestBusy, setRequestBusy] = useState(false);
  const [startOtp, setStartOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or repeated requests");
  const [reportSent, setReportSent] = useState(false);
  const [reportNotes, setReportNotes] = useState("");
  const feedRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const showToast = (message: string) => setToast(message);

  useEffect(() => {
    let alive = true;
    api
      .listBookings()
      .then((data) => {
        if (!alive) return;
        const bookings = data.bookings || [];
        const pending = bookings.filter((b) => b.status === "pending");
        const awaitingStart = bookings.filter((b) => b.status === "accepted");
        if (pending.length) {
          setBrandRequest(bookingToRequest(pending[0]));
          setRequestStatus("pending");
        } else if (awaitingStart.length) {
          setBrandRequest(bookingToRequest(awaitingStart[0]));
          setRequestStatus("accepted");
        } else {
          setBrandRequest(DEMO_BRAND_REQUEST);
          setRequestStatus("pending");
        }
      })
      .catch(() => {
        if (!alive) return;
        setBrandRequest(DEMO_BRAND_REQUEST);
        setRequestStatus("pending");
      });
    return () => {
      alive = false;
    };
  }, []);

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
        const campaigns = sortCampaigns(data.campaigns || [], filters.sort);
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

  const aiTicker = useMemo(() => {
    const summary = counts.booked
      ? `${counts.booked} brand booking${counts.booked === 1 ? "" : "s"} · ${state.savedCampaignIds.length} saved`
      : `Based on your audience · ${state.savedCampaignIds.length} saved`;
    const highlights = list
      .slice(0, 5)
      .map((c) => `${c.brand}: ${c.title}`)
      .join("   ·   ");
    return highlights ? `${highlights}   ·   ${summary}` : summary;
  }, [counts.booked, list, state.savedCampaignIds.length]);

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const node = sortRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [sortOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applySort = (sort: OpportunityFilters["sort"]) => {
    setFilters((f) => ({ ...f, sort }));
    setList((current) => sortCampaigns(current, sort));
    setSortOpen(false);
    feedRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

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
          aria-label={savedOnly ? "Show all campaigns" : "Show saved campaigns"}
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
        <div className="ai-match-copy">
          <small>ORBITLY AI</small>
          <strong>{list.length} matches</strong>
          <div className="ai-match-ticker" aria-label={aiTicker}>
            <div className="ai-match-ticker-track">
              <span>{aiTicker}</span>
              <span aria-hidden="true">{aiTicker}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label="Show AI matches"
          onClick={() => {
            setPill("For you");
            setSavedOnly(false);
            applySort("recommended");
            feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <Icon name="arrow" size={16} />
        </button>
      </section>

      {brandRequest && requestStatus !== "hidden" && (
        <article className={`creator-incoming-request ${requestStatus}`}>
          <header>
            <span>NEW BRAND REQUEST</span>
            <button type="button" onClick={() => setReportOpen(true)}>
              <Icon name="shield" size={13} /> Report brand
            </button>
          </header>
          <div className="incoming-brand-row">
            <div className="incoming-brand-mark">{brandRequest.mark}</div>
            <div>
              <h3>
                {brandRequest.brand}
                <b>
                  <Icon name="check" size={8} />
                </b>
              </h3>
              <p>{brandRequest.title}</p>
            </div>
            <strong>{brandRequest.pay}</strong>
          </div>
          <p className="incoming-request-copy">{brandRequest.copy}</p>
          {requestStatus === "pending" && (
            <footer>
              <button
                type="button"
                className="incoming-decline"
                disabled={requestBusy}
                onClick={() => {
                  if (!brandRequest.bookingId) {
                    setRequestStatus("declined");
                    return;
                  }
                  setRequestBusy(true);
                  void api
                    .declineBooking(brandRequest.bookingId)
                    .then(() => {
                      setRequestStatus("declined");
                      showToast("Request declined");
                    })
                    .catch(() => showToast("Couldn’t decline request"))
                    .finally(() => setRequestBusy(false));
                }}
              >
                Decline
              </button>
              <button
                type="button"
                className="incoming-accept"
                disabled={requestBusy}
                onClick={() => {
                  if (!brandRequest.bookingId) {
                    setRequestStatus("accepted");
                    showToast("Request accepted");
                    return;
                  }
                  setRequestBusy(true);
                  void api
                    .acceptBooking(brandRequest.bookingId)
                    .then((data) => {
                      setBrandRequest((prev) =>
                        prev
                          ? {
                              ...prev,
                              threadId: data.booking.threadId || prev.threadId,
                            }
                          : prev,
                      );
                      setRequestStatus("accepted");
                      showToast("Request accepted");
                    })
                    .catch(() => showToast("Couldn’t accept request"))
                    .finally(() => setRequestBusy(false));
                }}
              >
                Accept request <Icon name="check" size={13} />
              </button>
            </footer>
          )}
          {requestStatus === "accepted" && (
            <div className="incoming-accepted" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span>
                  <Icon name="check" size={14} />
                </span>
                <div style={{ flex: 1 }}>
                  <strong>Request accepted</strong>
                  <small>Ask the brand for the start OTP, then enter it below to begin.</small>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (brandRequest.threadId && onChat) {
                      onChat(brandRequest.threadId);
                      return;
                    }
                    showToast("Open Work to message the brand");
                  }}
                >
                  <Icon name="message" size={14} /> Chat
                </button>
              </div>
              {brandRequest.bookingId && !brandRequest.isDemo ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Start OTP"
                    value={startOtp}
                    onChange={(e) => {
                      setStartOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpError("");
                    }}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      height: 40,
                      borderRadius: 10,
                      border: "1px solid #cfd5cb",
                      padding: "0 12px",
                      letterSpacing: 3,
                      fontWeight: 700,
                    }}
                  />
                  <button
                    type="button"
                    className="incoming-accept"
                    disabled={otpBusy || startOtp.length < 4}
                    onClick={() => {
                      if (!brandRequest.bookingId) return;
                      setOtpBusy(true);
                      setOtpError("");
                      void api
                        .verifyBookingStart(brandRequest.bookingId, startOtp)
                        .then(() => {
                          showToast("Shoot started");
                          setRequestStatus("hidden");
                          setStartOtp("");
                        })
                        .catch((err) => {
                          setOtpError(err instanceof Error ? err.message : "Invalid OTP");
                        })
                        .finally(() => setOtpBusy(false));
                    }}
                  >
                    {otpBusy ? "Verifying…" : "Start shoot"}
                  </button>
                  {otpError ? (
                    <p className="booking-error" style={{ width: "100%", margin: 0 }}>
                      {otpError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
          {requestStatus === "declined" && (
            <div className="incoming-declined">
              Request declined
              <button
                type="button"
                onClick={() => {
                  setRequestStatus("pending");
                }}
              >
                Undo
              </button>
              <button type="button" onClick={() => setRequestStatus("hidden")}>
                Dismiss
              </button>
            </div>
          )}
        </article>
      )}

      <div className="creator-results-line">
        <strong>Best matches</strong>
        <div className={`sort-dropdown ${sortOpen ? "is-open" : ""}`} ref={sortRef}>
          <button
            type="button"
            className="sort-dropdown-trigger"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen((v) => !v)}
          >
            <span>{sortLabel}</span>
            <Icon name="chevron" size={12} />
          </button>
          {sortOpen && (
            <div className="sort-dropdown-menu" role="listbox">
              {SORT_OPTIONS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={filters.sort === id}
                  className={filters.sort === id ? "active" : ""}
                  onClick={() => applySort(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {loadError && <p className="work-inline-notice is-error">{loadError}</p>}
      <div className="opportunity-feed" ref={feedRef}>
        {list.map((campaign, index) => {
          const saved = state.savedCampaignIds.includes(campaign.id);
          const applied = state.appliedCampaignIds.includes(campaign.id);
          const isBooking = Boolean(campaign.bookingId);
          return (
            <article key={campaign.id} className="opportunity-card-item">
              <div className={`campaign-art ca-${index % 4}`}>
                <div className="campaign-art-top">
                  <span className="campaign-brand-mark">{campaign.icon}</span>
                  <div className="campaign-art-actions">
                    <span className="feed-match">
                      <Icon name="sparkles" size={10} />
                      {typeof campaign.match === "number" ? `${campaign.match}%` : "Open"}
                    </span>
                    <button
                      type="button"
                      className={`campaign-save-btn ${saved ? "is-saved" : ""}`}
                      aria-label={saved ? "Unsave campaign" : "Save campaign"}
                      onClick={() => {
                        void toggleSaveCampaign(campaign.id)
                          .then(() => {
                            setCounts((c) => ({
                              ...c,
                              saved: Math.max(0, c.saved + (saved ? -1 : 1)),
                            }));
                            showToast(saved ? "Removed from saved" : "Saved to your list");
                          })
                          .catch(() => showToast("Couldn’t update saved"));
                      }}
                    >
                      <Icon name="bookmark" size={16} fill={saved} />
                    </button>
                  </div>
                </div>
                <div className="campaign-shape s-one" />
                <div className="campaign-shape s-two" />
                <strong>{campaign.brand}</strong>
              </div>
              <div className="campaign-feed-copy">
                <span className="campaign-verified">
                  {campaign.brand} ·{" "}
                  {isBooking
                    ? campaign.bookingMode === "instant"
                      ? "INSTANT"
                      : "SCHEDULED"
                    : "VERIFIED"}
                </span>
                <h3>{campaign.title}</h3>
                <p className="campaign-meta">
                  <span>
                    <Icon name="camera" size={12} />
                    {campaign.type}
                  </span>
                  <i />
                  <span>
                    <Icon name="calendar" size={12} />
                    {isBooking ? "Due" : "Apply by"} {campaign.applyBy}
                  </span>
                </p>
                <div className="campaign-tags">
                  {(campaign.tags?.length
                    ? campaign.tags.slice(0, 3)
                    : ["Paid", "Usage: 3 months", campaign.location || "Remote"]
                  ).map((tag) => (
                    <b key={tag}>{tag}</b>
                  ))}
                </div>
                <footer className="campaign-feed-footer">
                  <div className="campaign-pay">
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
            setList((current) => sortCampaigns(current, next.sort));
            showToast("Filters applied");
          }}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {reportOpen && brandRequest && (
        <div
          className="report-brand-layer"
          onClick={() => {
            setReportOpen(false);
            setReportSent(false);
            setReportNotes("");
          }}
        >
          <section className="report-brand-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            {!reportSent ? (
              <>
                <header>
                  <span>
                    <Icon name="shield" size={18} />
                  </span>
                  <div>
                    <small>SAFETY & TRUST</small>
                    <h2>Report {brandRequest.brand}</h2>
                    <p>The brand won’t be notified that you submitted a report.</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close report"
                    onClick={() => {
                      setReportOpen(false);
                      setReportSent(false);
                    }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </header>
                <div className="report-reasons">
                  {[
                    "Spam or repeated requests",
                    "Fake brand or identity",
                    "Inappropriate content or behavior",
                    "Scam or suspicious payment request",
                    "Something else",
                  ].map((reason) => (
                    <button
                      type="button"
                      className={reportReason === reason ? "active" : ""}
                      key={reason}
                      onClick={() => setReportReason(reason)}
                    >
                      <i />
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Add details (optional)"
                />
                <button
                  type="button"
                  className="submit-brand-report"
                  onClick={() => {
                    setReportSent(true);
                    showToast("Report submitted");
                  }}
                >
                  Submit report
                </button>
              </>
            ) : (
              <div className="report-sent-state">
                <span>
                  <Icon name="check" size={23} />
                </span>
                <small>REPORT RECEIVED</small>
                <h2>Thank you for letting us know.</h2>
                <p>Our safety team will review this brand and take action if needed.</p>
                <button
                  type="button"
                  onClick={() => {
                    setReportOpen(false);
                    setReportSent(false);
                    setReportNotes("");
                    setRequestStatus("hidden");
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="opp-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
