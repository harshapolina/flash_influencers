import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import { StatusBar } from "../../components/ui/StatusBar";
import type { Campaign } from "../../types";

const PILLS = ["For you", "UGC", "Fashion", "Affiliate", "Nearby"] as const;

export function CreatorOpportunitiesScreen() {
  const { state, toggleSaveCampaign, applyCampaign } = useAppStore();
  const [query, setQuery] = useState("");
  const [pill, setPill] = useState<(typeof PILLS)[number]>("For you");
  const [savedOnly, setSavedOnly] = useState(false);
  const [list, setList] = useState<Campaign[]>([]);
  const [brief, setBrief] = useState<Campaign | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .listCampaigns({ query, pill, savedOnly })
      .then((data) => {
        if (!alive) return;
        setList(data.campaigns || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [query, pill, savedOnly, state.savedCampaignIds, state.appliedCampaignIds]);

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
        <button
          type="button"
          onClick={() => setPill(PILLS[(PILLS.indexOf(pill) + 1) % PILLS.length])}
        >
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
          <p>Based on your audience and content style</p>
        </div>
        <button type="button">
          <Icon name="arrow" size={16} />
        </button>
      </section>
      <div className="creator-results-line">
        <strong>Best matches</strong>
        <button type="button">
          Recommended <Icon name="chevron" size={12} />
        </button>
      </div>
      <div className="opportunity-feed">
        {list.map((campaign, index) => {
          const saved = state.savedCampaignIds.includes(campaign.id);
          const applied = state.appliedCampaignIds.includes(campaign.id);
          return (
            <article key={campaign.id}>
              <div className={`campaign-art ca-${index % 4}`}>
                <span className="campaign-brand-mark">{campaign.icon}</span>
                <span className="feed-match">
                  <Icon name="sparkles" size={10} />
                  {typeof campaign.match === "number" ? `${campaign.match}%` : "Open"}
                </span>
                <button type="button" onClick={() => void toggleSaveCampaign(campaign.id)}>
                  <Icon name="bookmark" size={16} fill={saved} />
                </button>
                <div className="campaign-shape s-one" />
                <div className="campaign-shape s-two" />
                <strong>{campaign.brand}</strong>
              </div>
              <div className="campaign-feed-copy">
                <span>{campaign.brand} · VERIFIED</span>
                <h3>{campaign.title}</h3>
                <p>
                  <Icon name="camera" size={12} />
                  {campaign.type}
                  <i />
                  <Icon name="calendar" size={12} />
                  Apply by {campaign.applyBy}
                </p>
                <div className="campaign-tags">
                  <b>Paid</b>
                  <b>Usage: 3 months</b>
                  <b>Remote</b>
                </div>
                <footer>
                  <div>
                    <small>CREATOR PAY</small>
                    <strong>{campaign.pay}</strong>
                  </div>
                  <button type="button" onClick={() => setBrief(campaign)}>
                    {applied ? "Applied" : "View brief"} <Icon name="arrow" size={14} />
                  </button>
                </footer>
              </div>
            </article>
          );
        })}
        {brief && (
          <article>
            <div className="campaign-feed-copy">
              <span>{brief.brand}</span>
              <h3>{brief.title}</h3>
              <p>
                {brief.type} · {brief.pay} · Apply by {brief.applyBy}
              </p>
              {notice && <p>{notice}</p>}
              <footer>
                <button type="button" onClick={() => setBrief(null)}>
                  Close
                </button>
                <button
                  type="button"
                  disabled={state.appliedCampaignIds.includes(brief.id)}
                  onClick={() => {
                    void applyCampaign(brief.id)
                      .then(() => setNotice("Application sent. It is now in Work."))
                      .catch(() => setNotice("Could not send the application."));
                  }}
                >
                  {state.appliedCampaignIds.includes(brief.id) ? "Applied" : "Apply"}
                </button>
              </footer>
            </div>
          </article>
        )}
        {!list.length && (
          <div className="empty" style={{ padding: 40 }}>
            <h3>No opportunities</h3>
            <p>Try another filter or clear saved-only mode.</p>
          </div>
        )}
      </div>
    </div>
  );
}
