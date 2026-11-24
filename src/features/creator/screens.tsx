import { useEffect, useState } from "react";
import { Icon } from "../../lib/icons";
import type { Campaign, CreatorTab, IconName, WorkItem } from "../../types";
import { api, type SocialAccount } from "../../lib/api";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { useAppStore } from "../../store/AppStore";

function socialAccounts(profile?: Record<string, unknown>) {
  const social = profile?.social;
  if (!social || typeof social !== "object") return [];
  return Object.values(social as Record<string, SocialAccount>);
}

function averageViewRate(accounts: SocialAccount[]) {
  const rates = accounts.map((account) => account.viewRate || 0).filter(Boolean);
  if (!rates.length) return "—";
  return `${Math.round((rates.reduce((sum, value) => sum + value, 0) / rates.length) * 10) / 10}%`;
}

function profileStrength(profile?: Record<string, unknown>) {
  const fields = (profile?.fields || {}) as Record<string, string>;
  const checks = [
    Boolean(fields["Personal Information:LEGAL NAME"] || fields["Personal Information:DISPLAY NAME"]),
    Boolean(fields["Location Details:LOCATION"]),
    socialAccounts(profile).length > 0,
    Boolean(fields["Content Portfolio:LINK"]),
    Boolean(fields["Payment Information:UPI ID"]),
    Boolean(fields["Pricing Preferences:AMOUNT"]),
    Boolean(fields["Availability:SCHEDULE"]),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function CreatorHomeScreen({
  onExplore,
  onWork,
  onEarnings,
}: {
  onExplore: () => void;
  onWork?: () => void;
  onEarnings?: () => void;
}) {
  const { state, refreshSession } = useAppStore();
  const [campaigns, setCampaigns] = useState<Array<Campaign & { icon?: string; type?: string; pay?: string; match?: number }>>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [earnings, setEarnings] = useState<{ available: number; earnedThisMonth: number } | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    api.listCampaigns({}).then((data) => setCampaigns(data.campaigns || [])).catch(() => {});
    api.myWork().then((data) => setWork(data.items || [])).catch(() => {});
    api.earnings().then((data) => setEarnings(data)).catch(() => {});
    refreshSession().catch(() => {});
  }, [refreshSession]);

  const accounts = socialAccounts(state.user?.profile);
  const userName = state.user?.name || "Creator";
  const avatar = accounts.find((account) => account.avatar)?.avatar || state.user?.avatarUrl || "";
  const active = work.find((item) => item.bucket === "active");
  const available = earnings?.available ?? 0;
  const month = earnings?.earnedThisMonth ?? 0;
  const strength = profileStrength(state.user?.profile);
  const engagement = averageViewRate(accounts);

  return (
    <div className="screen creator-home-screen">
      <StatusBar />
      <header className="creator-home-head">
        <div className="creator-head-avatar">
          {avatar ? <img src={avatar} alt={userName} /> : <Icon name="user" size={22} />}
          <i />
        </div>
        <div>
          <small>GOOD MORNING</small>
          <strong>
            {userName}{" "}
            <span>
              <Icon name="check" size={8} />
            </span>
          </strong>
        </div>
        <button className="round-button" type="button" onClick={() => setShowNotes((open) => !open)}>
          <Icon name="bell" size={19} />
          {work.length > 0 && <i />}
        </button>
      </header>
      {showNotes && (
        <section className="creator-active-work">
          <div className="active-work-copy">
            <span>UPDATES</span>
            <strong>{work.length ? `${work.length} campaign updates` : "No updates yet"}</strong>
            <small>
              {work.length
                ? work.map((item) => `${item.brand}: ${item.status}`).join(" · ")
                : "Applications and payouts will show up here."}
            </small>
          </div>
        </section>
      )}

      <section className="creator-wallet-hero">
        <div className="wallet-copy">
          <span>
            <Icon name="wallet" size={14} /> AVAILABLE BALANCE
          </span>
          <strong>₹{available.toLocaleString("en-IN")}</strong>
          <p>
            <b>+₹{month.toLocaleString("en-IN")}</b> earned this month
          </p>
          <button type="button" onClick={onEarnings}>
            Withdraw earnings <Icon name="arrow" size={14} />
          </button>
        </div>
        <div className="wallet-visual">
          {avatar ? <img src={avatar} alt="" /> : <Icon name="user" size={28} />}
          <i className="wallet-orbit" />
        </div>
      </section>

      <section className="creator-profile-strength">
        <div className="strength-ring">
          <strong>{strength}</strong>
          <small>%</small>
        </div>
        <div>
          <span>PROFILE STRENGTH</span>
          <strong>{strength === 100 ? "Profile complete" : "Finish the remaining profile steps"}</strong>
          <small>
            {strength === 100
              ? "Brands can see your connected accounts and payout details."
              : "Location, social accounts, portfolio, pricing, availability, and payout each raise this."}
          </small>
        </div>
        <button>
          <Icon name="chevron" size={15} />
        </button>
      </section>

      <div className="creator-kpis">
        <div>
          <span className="kpi-icon lime">
            <Icon name="briefcase" size={16} />
          </span>
          <strong>{work.filter((item) => item.bucket === "active").length}</strong>
          <small>Active work</small>
        </div>
        <div>
          <span className="kpi-icon purple">
            <Icon name="search" size={16} />
          </span>
          <strong>{campaigns.length}</strong>
          <small>New matches</small>
        </div>
        <div>
          <span className="kpi-icon peach">
            <Icon name="trending" size={16} />
          </span>
          <strong>{engagement}</strong>
          <small>View rate</small>
        </div>
      </div>

      <SectionTitle title="Matched for you" action="See all" onClick={onExplore} />
      <div className="opportunity-carousel">
        {campaigns.map((campaign, index) => (
          <button
            className={`opportunity-tile ot-${index}`}
            onClick={onExplore}
            key={campaign.title}
          >
            <div className="opportunity-tile-top">
              <span className="brand-glyph">{campaign.icon}</span>
              <span className="match-score">
                <Icon name="sparkles" size={10} />
                {typeof campaign.match === "number" ? `${campaign.match}% match` : campaign.type || "Open"}
              </span>
            </div>
            <div className="opportunity-art">
              {index === 0 ? (
                <img
                  src="https://images.unsplash.com/photo-1695408247109-3bf125ad0538?crop=faces&fit=crop&w=500&h=360&q=85"
                  alt="Creator campaign"
                />
              ) : (
                <>
                  <i />
                  <i />
                  <strong>{campaign.icon}</strong>
                </>
              )}
            </div>
            <div className="opportunity-tile-copy">
              <small>{campaign.brand}</small>
              <strong>{campaign.title}</strong>
              <span>{campaign.type}</span>
              <footer>
                <b>{campaign.pay}</b>
                <i>
                  <Icon name="arrow" size={13} />
                </i>
              </footer>
            </div>
          </button>
        ))}
      </div>

      <SectionTitle title="Active campaign" action="View work" onClick={onWork} />
      <section className="creator-active-work">
        <div className="active-work-brand">{(active?.brand || "—").slice(0, 2).toUpperCase()}</div>
        <div className="active-work-copy">
          <span>{active ? `${active.brand} · ${active.title}` : "NO ACTIVE WORK"}</span>
          <strong>{active ? active.status : "Apply to a campaign"}</strong>
          <div className="work-progress">
            <i style={{ width: `${active?.progress ?? 0}%` }} />
          </div>
          <small>{active ? `Due ${active.due}` : "Your work list is empty"}</small>
        </div>
        <button>
          <Icon name="chevron" size={15} />
        </button>
      </section>

      <SectionTitle title="This month" action="Analytics" onClick={() => setShowAnalytics((open) => !open)} />
      {showAnalytics && (
        <section className="creator-performance-card">
          {accounts.length === 0 && <p>Connect Instagram or YouTube to see analytics.</p>}
          {accounts.map((account) => (
            <div key={account.platform}>
              <span>{account.platform.toUpperCase()}</span>
              <strong>{formatSocialCount(account.followers)} followers</strong>
              <small>
                {account.views ? `${formatSocialCount(account.views)} avg views` : "No view count yet"}
                {account.viewRate ? ` · ${account.viewRate}% view rate` : ""}
              </small>
            </div>
          ))}
        </section>
      )}
      <section className="creator-performance-card">
        <div>
          <span>CONTENT REACH</span>
          <strong>{formatSocialCount(accounts.reduce((sum, account) => sum + (account.views || 0), 0))}</strong>
          <small>Average views from connected accounts</small>
        </div>
        <div className="creator-mini-chart">
          {[32, 48, 40, 66, 52, 81, 74, 92].map((height, index) => (
            <i
              style={{ height: `${height}%` }}
              className={index === 7 ? "active" : ""}
              key={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function formatSocialCount(value?: number) {
  if (!value) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

function ConnectedAccounts({ social }: { social: unknown }) {
  const accounts = social && typeof social === "object" ? (Object.values(social) as SocialAccount[]) : [];
  if (!accounts.length) return null;
  return (
    <div className="creator-profile-menu">
      {accounts.map((account) => (
        <a key={account.platform} href={account.url} target="_blank" rel="noreferrer">
          <span>
            <Icon name={account.platform === "youtube" ? "youtube" : "instagram"} size={17} />
          </span>
          <strong>
            {account.name} · {formatSocialCount(account.followers)}
            {account.viewRate ? ` · ${account.viewRate}% views` : ""}
          </strong>
          <Icon name="chevron" size={15} />
        </a>
      ))}
    </div>
  );
}

export function CreatorAppProfile() {
  const { state, resetSession, refreshSession } = useAppStore();
  useEffect(() => {
    refreshSession().catch(() => {});
  }, [refreshSession]);
  const accounts = socialAccounts(state.user?.profile);
  const fields = (state.user?.profile?.fields || {}) as Record<string, string>;
  const answers = (state.user?.profile?.answers || {}) as Record<string, string[]>;
  const name = fields["Personal Information:DISPLAY NAME"] || state.user?.name || "Creator";
  const handle = accounts[0]?.handle || fields["Personal Information:CREATOR USERNAME"] || state.user?.email || "";
  const city = fields["Location Details:LOCATION"] || "Location not added";
  const avatar = accounts.find((account) => account.avatar)?.avatar || state.user?.avatarUrl || "";
  const followers = accounts.reduce((sum, account) => sum + (account.followers || 0), 0);
  const strength = profileStrength(state.user?.profile);
  const tags = [
    ...(answers["Creator Category"] || []),
    ...(answers["Content Categories"] || []),
  ].slice(0, 3);
  const [openDetail, setOpenDetail] = useState("");
  const details: Record<string, string> = {
    "Public profile": `${name} · ${handle}`,
    Portfolio: fields["Content Portfolio:LINK"] || "No portfolio link saved",
    "Social accounts": accounts.map((account) => account.handle).join(", ") || "No account connected",
    "Pricing & packages": fields["Pricing Preferences:AMOUNT"]
      ? `Starting at ₹${Number(fields["Pricing Preferences:AMOUNT"]).toLocaleString("en-IN")}`
      : "No starting price saved",
    Availability: fields["Availability:SCHEDULE"] ? "Schedule saved" : "No availability saved",
    Verification: state.user?.emailVerified ? "Email verified" : "Email not verified",
    "Settings & privacy": state.user?.email || "",
    "Creator support": "Write to the address on your account email",
  };
  return (
    <div className="screen creator-app-profile">
      <StatusBar />
      <header className="creator-profile-hero">
        <button className="round-button" type="button">
          <Icon name="bell" size={18} />
        </button>
        <div className="creator-profile-image">
          {avatar ? <img src={avatar} alt={name} /> : <Icon name="user" size={28} />}
          {state.user?.emailVerified && (
            <span>
              <Icon name="check" size={10} />
            </span>
          )}
        </div>
        <h1>{name}</h1>
        <p>
          {handle} · {city}
        </p>
        <div className="creator-profile-tags">
          {(tags.length ? tags : ["Creator"]).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </header>
      <div className="creator-profile-stats">
        <div>
          <strong>{formatSocialCount(followers)}</strong>
          <span>Followers</span>
        </div>
        <div>
          <strong>{averageViewRate(accounts)}</strong>
          <span>View rate</span>
        </div>
        <div>
          <strong>{accounts.length}</strong>
          <span>Connected</span>
        </div>
      </div>
      <div className="profile-strength-card">
        <span>PROFILE COMPLETION</span>
        <div>
          <i style={{ width: `${strength}%` }} />
        </div>
        <p>
          <strong>{strength}% complete</strong>
          <small>Filled from the details you saved during onboarding</small>
        </p>
      </div>
      <ConnectedAccounts social={state.user?.profile?.social} />
      <div className="creator-profile-menu">
        {[
          ["Public profile", "user"],
          ["Portfolio", "camera"],
          ["Social accounts", "instagram"],
          ["Pricing & packages", "wallet"],
          ["Availability", "calendar"],
          ["Verification", "shield"],
          ["Settings & privacy", "filter"],
          ["Creator support", "message"],
        ].map(([label, icon]) => (
          <div key={label}>
            <button type="button" onClick={() => setOpenDetail(openDetail === label ? "" : label)}>
              <span>
                <Icon name={icon as IconName} size={17} />
              </span>
              <strong>{label}</strong>
              {label === "Verification" && state.user?.emailVerified && <b>VERIFIED</b>}
              <Icon name="chevron" size={15} />
            </button>
            {openDetail === label && details[label] && <p className="flow-error">{details[label]}</p>}
          </div>
        ))}
        <button type="button" onClick={resetSession}>
          <span>
            <Icon name="close" size={17} />
          </span>
          <strong>Sign out</strong>
          <Icon name="chevron" size={15} />
        </button>
      </div>
    </div>
  );
}

function OpportunityCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api
      .listCampaigns({})
      .then((data) => setCount(data.campaigns?.length || 0))
      .catch(() => {});
  }, []);
  if (!count) return null;
  return <i>{count}</i>;
}

export function CreatorBottomNav({
  active,
  onChange,
}: {
  active: CreatorTab;
  onChange: (tab: CreatorTab) => void;
}) {
  const tabs: [CreatorTab, IconName][] = [
    ["Home", "home"],
    ["Opportunities", "search"],
    ["Work", "briefcase"],
    ["Earnings", "wallet"],
    ["Profile", "user"],
  ];
  return (
    <nav className="bottom-nav creator-bottom-nav" aria-label="Creator navigation">
      <span className="nav-liquid-glow" aria-hidden />
      {tabs.map(([label, icon]) => (
        <button
          key={label}
          className={active === label ? "active" : ""}
          onClick={() => onChange(label)}
          aria-current={active === label ? "page" : undefined}
        >
          <span className="nav-icon-wrap">
            <Icon name={icon} size={20} fill={active === label} />
            {label === "Opportunities" && <OpportunityCount />}
            <b className="nav-reflection" />
          </span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}
