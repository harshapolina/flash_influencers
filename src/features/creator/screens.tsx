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
  onOpenCampaign,
  onWork,
  onEarnings,
  onNotifications,
  onInbox,
  onAnalytics,
  onProfile,
}: {
  onExplore: () => void;
  onOpenCampaign?: (campaignId: string) => void;
  onWork?: () => void;
  onEarnings?: () => void;
  onNotifications?: () => void;
  onInbox?: () => void;
  onAnalytics?: () => void;
  onProfile?: () => void;
}) {
  const { state, refreshSession } = useAppStore();
  const [campaigns, setCampaigns] = useState<Array<Campaign & { icon?: string; type?: string; pay?: string; match?: number }>>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [earnings, setEarnings] = useState<{ available: number; earnedThisMonth: number } | null>(null);

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
        <button className="round-button" type="button" onClick={onNotifications}>
          <Icon name="bell" size={19} />
          {work.length > 0 && <i />}
        </button>
      </header>

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
            {available > 0 ? "Withdraw earnings" : "View earnings"} <Icon name="arrow" size={14} />
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
        <button type="button" onClick={onProfile}>
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
            type="button"
            onClick={() =>
              onOpenCampaign ? onOpenCampaign(campaign.id) : onExplore()
            }
            key={campaign.id || campaign.title}
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
      <button
        type="button"
        className="creator-active-work"
        onClick={() => (active ? onWork?.() : onExplore())}
      >
        <div className="active-work-brand">{(active?.brand || "—").slice(0, 2).toUpperCase()}</div>
        <div className="active-work-copy">
          <span>{active ? `${active.brand} · ${active.title}` : "NO ACTIVE WORK"}</span>
          <strong>{active ? active.status : "Apply to a campaign"}</strong>
          <div className="work-progress">
            <i style={{ width: `${active?.progress ?? 0}%` }} />
          </div>
          <small>{active ? `Due ${active.due}` : "Your work list is empty"}</small>
        </div>
        <span className="active-work-chevron">
          <Icon name="chevron" size={15} />
        </span>
      </button>

      <SectionTitle title="This month" action="Analytics" onClick={onAnalytics} />
      <section className="creator-quick-actions">
        <button type="button" onClick={onInbox}>
          <Icon name="message" size={16} />
          Messages
        </button>
        <button type="button" onClick={onNotifications}>
          <Icon name="bell" size={16} />
          Alerts
        </button>
        <button type="button" onClick={onAnalytics}>
          <Icon name="trending" size={16} />
          Analytics
        </button>
      </section>
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

function ConnectedAccounts({
  social,
  onManage,
}: {
  social: unknown;
  onManage?: () => void;
}) {
  const accounts = social && typeof social === "object" ? (Object.values(social) as SocialAccount[]) : [];
  if (!accounts.length) return null;
  return (
    <section className="profile-section-card">
      <header className="profile-section-head">
        <div>
          <small>CONNECTED</small>
          <strong>Social accounts</strong>
        </div>
        {onManage && (
          <button type="button" onClick={onManage}>
            Manage
          </button>
        )}
      </header>
      <div className="creator-profile-menu flat profile-social-list">
        {accounts.map((account) => (
          <a key={account.platform} href={account.url} target="_blank" rel="noreferrer">
            <span>
              <Icon name={account.platform === "youtube" ? "youtube" : "instagram"} size={17} />
            </span>
            <div className="profile-social-copy">
              <strong>{account.name || account.handle || account.platform}</strong>
              <small>
                {account.platform === "youtube" ? "YouTube" : "Instagram"}
                {account.handle ? ` · ${account.handle}` : ""}
                {" · "}
                {formatSocialCount(account.followers)}{" "}
                {(account.followers || 0) === 1 ? "follower" : "followers"}
                {account.viewRate ? ` · ${account.viewRate}% views` : ""}
              </small>
            </div>
            <Icon name="chevron" size={15} />
          </a>
        ))}
      </div>
    </section>
  );
}

function nextProfileGap(profile?: Record<string, unknown>) {
  const fields = (profile?.fields || {}) as Record<string, string>;
  if (!fields["Personal Information:DISPLAY NAME"] && !fields["Personal Information:LEGAL NAME"]) {
    return "Public profile" as const;
  }
  if (!fields["Location Details:LOCATION"]) return "Public profile" as const;
  if (!socialAccounts(profile).length) return "Social accounts" as const;
  if (!fields["Content Portfolio:LINK"]) return "Portfolio" as const;
  if (!fields["Pricing Preferences:AMOUNT"]) return "Pricing & packages" as const;
  if (!fields["Availability:SCHEDULE"]) return "Availability" as const;
  if (!fields["Payment Information:UPI ID"]) return "Settings & privacy" as const;
  return "Public profile" as const;
}

export function CreatorAppProfile({
  onNotifications,
  onOpenPage,
}: {
  onNotifications?: () => void;
  onOpenPage?: (
    page:
      | "Public profile"
      | "Portfolio"
      | "Social accounts"
      | "Pricing & packages"
      | "Availability"
      | "Verification"
      | "Settings & privacy"
      | "Creator support",
  ) => void;
}) {
  const { state, resetSession, refreshSession } = useAppStore();
  useEffect(() => {
    refreshSession().catch(() => {});
  }, [refreshSession]);
  const accounts = socialAccounts(state.user?.profile);
  const fields = (state.user?.profile?.fields || {}) as Record<string, string>;
  const answers = (state.user?.profile?.answers || {}) as Record<string, string[]>;
  const name = fields["Personal Information:DISPLAY NAME"] || state.user?.name || "Creator";
  const handle =
    accounts[0]?.handle ||
    fields["Personal Information:CREATOR USERNAME"] ||
    state.user?.email ||
    "";
  const city = fields["Location Details:LOCATION"] || "Location not added";
  const avatar = accounts.find((account) => account.avatar)?.avatar || state.user?.avatarUrl || "";
  const followers = accounts.reduce((sum, account) => sum + (account.followers || 0), 0);
  const strength = profileStrength(state.user?.profile);
  const gap = nextProfileGap(state.user?.profile);
  const tags = Array.from(
    new Set([...(answers["Creator Category"] || []), ...(answers["Content Categories"] || [])]),
  ).slice(0, 4);

  return (
    <div className="screen creator-app-profile">
      <StatusBar />
      <header className="creator-profile-hero">
        <button
          className="round-button profile-bell"
          type="button"
          aria-label="Notifications"
          onClick={onNotifications}
        >
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
          {handle}
          <i>·</i>
          {city}
        </p>
        <div className="creator-profile-tags">
          {(tags.length ? tags : ["Creator"]).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <button
          type="button"
          className="edit-creator-profile"
          onClick={() => onOpenPage?.("Public profile")}
        >
          View public profile
        </button>
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

      <button
        type="button"
        className="profile-strength-card as-button"
        onClick={() => onOpenPage?.(gap)}
      >
        <span>PROFILE COMPLETION</span>
        <div>
          <i style={{ width: `${strength}%` }} />
        </div>
        <p>
          <strong>{strength}% complete</strong>
          <small>{strength === 100 ? "Profile looks complete" : `Next: ${gap}`}</small>
        </p>
      </button>

      <ConnectedAccounts
        social={state.user?.profile?.social}
        onManage={() => onOpenPage?.("Social accounts")}
      />

      <section className="profile-section-card">
        <header className="profile-section-head">
          <div>
            <small>ACCOUNT</small>
            <strong>Manage profile</strong>
          </div>
        </header>
        <div className="creator-profile-menu flat">
          {(
            [
              ["Public profile", "user"],
              ["Portfolio", "camera"],
              ["Social accounts", "instagram"],
              ["Pricing & packages", "wallet"],
              ["Availability", "calendar"],
              ["Verification", "shield"],
              ["Settings & privacy", "filter"],
              ["Creator support", "message"],
            ] as const
          ).map(([label, icon]) => (
            <button key={label} type="button" onClick={() => onOpenPage?.(label)}>
              <span>
                <Icon name={icon as IconName} size={17} />
              </span>
              <strong>{label}</strong>
              {label === "Verification" && state.user?.emailVerified && <b>VERIFIED</b>}
              <Icon name="chevron" size={15} />
            </button>
          ))}
          <button type="button" className="profile-signout" onClick={resetSession}>
            <span>
              <Icon name="close" size={17} />
            </span>
            <strong>Sign out</strong>
            <Icon name="chevron" size={15} />
          </button>
        </div>
      </section>
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
