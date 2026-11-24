import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import type { Booking, BrandCampaign, Creator, IconName, InboxMessage } from "../../types";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { useAppStore } from "../../store/AppStore";

function inrCompact(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function parseCount(value: string) {
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  if (!n) return 0;
  if (/m/i.test(value)) return n * 1_000_000;
  if (/k/i.test(value)) return n * 1_000;
  return n;
}

function compactCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function BrandHomeV2({
  onExplore,
  onCreator,
}: {
  onExplore: () => void;
  onCreator: (creator: Creator) => void;
}) {
  const { state, toggleLike, refreshCreators } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [counts, setCounts] = useState({ active: 0, applications: 0, completed: 0 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const saved = state.likedIds;
  const toggleSave = toggleLike;
  const creators = state.creatorsCache;
  const userName = state.user?.name || "there";
  const firstName = userName.split(" ")[0];
  const workspace =
    (typeof state.user?.profile.company === "string" && state.user.profile.company) ||
    (typeof state.user?.profile.brandName === "string" && state.user.profile.brandName) ||
    userName;
  const featured = campaigns.find((c) => c.status === "active") || campaigns[0];
  const spend = bookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
  const pending = bookings.filter((booking) => booking.status === "pending").length;
  const reach = creators.reduce((sum, creator) => sum + parseCount(creator.views), 0);
  const engagement = creators.reduce((sum, creator) => sum + parseCount(creator.engagement), 0);
  const recommended = [...creators].sort((a, b) => b.match - a.match).slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    void refreshCreators("");
    api
      .listCampaigns({})
      .then((data) => {
        setCampaigns(data.campaigns || []);
        setBookings(data.bookings || []);
        if (data.counts) setCounts(data.counts);
      })
      .catch(() => {});
    api
      .listMessages("all")
      .then((data) => setMessages(data.messages))
      .catch(() => {});
    // Load once when the workspace opens. refreshCreators changes whenever the cache updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen brand-v2">
      <StatusBar />

      <header className="bv2-header">
        <div className="bv2-location">
          <small>WORKSPACE</small>
          <strong>
            {workspace} <Icon name="chevron" size={13} />
          </strong>
        </div>
        <button className="bv2-icon-button">
          <Icon name="bell" size={18} />
          <i />
        </button>
        <button className="bv2-avatar">{initials(userName) || "OR"}</button>
      </header>

      <div className="bv2-search">
        <Icon name="search" size={19} />
        <input placeholder="Search creators, campaigns…" />
        <button>
          <Icon name="filter" size={17} />
        </button>
      </div>

      <section className="bv2-greeting">
        <span>
          {greeting}, {firstName}
        </span>
        <h1>
          Grow your brand
          <br />
          with the right <em>voices.</em>
        </h1>
        <p>
          {counts.applications + pending
            ? `${counts.applications + pending} items need your attention today.`
            : "Your workspace is up to date."}
        </p>
      </section>

      <div className="bv2-chips">
        <button className="active">Overview</button>
        <button>
          Approvals <b>{pending}</b>
        </button>
        <button>
          Applications <b>{counts.applications}</b>
        </button>
        <button>Reports</button>
      </div>

      <section className="bv2-featured">
        <img
          src={recommended[0]?.image || creators[0]?.image || ""}
          alt={featured?.title || "Campaign"}
        />
        <div className="bv2-featured-shade" />
        <span className="bv2-live">
          <i /> {(featured?.status || "active").toUpperCase()} CAMPAIGN
        </span>
        <button className="bv2-save">
          <Icon name="bookmark" size={17} />
        </button>
        <div className="bv2-featured-copy">
          <small>{featured?.brand || workspace}</small>
          <h2>{featured?.title || "No live campaign yet"}</h2>
          <div>
            <span>
              <Icon name="user" size={13} /> {featured?.creatorsConfirmed || `${creators.length} creators`}
            </span>
            <span>
              <Icon name="calendar" size={13} /> Due {featured?.due || "—"}
            </span>
          </div>
        </div>
        <div className="bv2-campaign-progress">
          <div>
            <span>Campaign progress</span>
            <strong>{featured?.progress ?? 0}%</strong>
          </div>
          <i>
            <b style={{ width: `${featured?.progress ?? 0}%` }} />
          </i>
          <button onClick={onExplore}>
            Manage campaign <Icon name="arrow" size={14} />
          </button>
        </div>
      </section>

      <div className="bv2-stat-scroll">
        {[
          [String(counts.active), "Active campaigns", "briefcase"],
          [String(creators.length), "Creators", "user"],
          [inrCompact(spend), "Total spend", "wallet"],
          [String(pending), "Pending approval", "clock"],
        ].map(([value, label, icon], index) => (
          <button className={index === 3 ? "attention" : ""} key={label}>
            <span>
              <Icon name={icon as IconName} size={17} />
            </span>
            <strong>{value}</strong>
            <small>{label}</small>
          </button>
        ))}
      </div>

      <SectionTitle title="Quick start" action="Edit" onClick={() => {}} />
      <div className="bv2-actions">
        {[
          ["Create campaign", "plus"],
          ["Find creators", "search"],
          ["Invite", "user"],
          ["Ask AI", "sparkles"],
        ].map(([label, icon], index) => (
          <button
            className={`action-${index}`}
            key={label}
            onClick={label === "Find creators" ? onExplore : undefined}
          >
            <span>
              <Icon name={icon as IconName} size={19} />
            </span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      <SectionTitle title="Recommended creators" action="See all" onClick={onExplore} />
      <div className="bv2-creators">
        {recommended.map((creator) => (
          <article key={creator.id}>
            <div className="bv2-creator-image" onClick={() => onCreator(creator)}>
              <img src={creator.image} alt={creator.name} />
              <span>
                <Icon name="sparkles" size={10} /> {creator.match}% fit
              </span>
              <button
                className={saved.includes(creator.id) ? "saved" : ""}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSave(creator.id);
                }}
              >
                <Icon name="heart" size={17} fill={saved.includes(creator.id)} />
              </button>
            </div>
            <div className="bv2-creator-copy">
              <h3>
                {creator.name}
                <b>
                  <Icon name="check" size={8} />
                </b>
              </h3>
              <p>
                {creator.niche} · {creator.city}
              </p>
              <div>
                <span>
                  <strong>{creator.followers}</strong>Followers
                </span>
                <span>
                  <strong>{creator.engagement}</strong>Engagement
                </span>
                <span>
                  <strong>{creator.views}</strong>Avg. views
                </span>
              </div>
              <footer>
                <span>
                  From <b>{creator.price}</b>
                </span>
                <button onClick={() => onCreator(creator)}>View profile</button>
              </footer>
            </div>
          </article>
        ))}
      </div>

      <SectionTitle title="Needs your attention" action="See all" onClick={() => {}} />
      <div className="bv2-list">
        {(
          campaigns.filter((c) => c.needsAttention).length
            ? campaigns
                .filter((c) => c.needsAttention)
                .slice(0, 3)
                .map((c) => ["briefcase", c.needsAttention || c.title, `${c.title} · due ${c.due}`, "View", "lavender"] as const)
            : bookings.slice(0, 3).map(
                (b) =>
                  ["wallet", b.deliverable, `${b.date} · ${inrCompact(b.price)}`, b.status, "orange"] as const,
              )
        ).map(([icon, title, detail, action, tone]) => (
          <button key={title}>
            <span className={tone}>
              <Icon name={icon as IconName} size={17} />
            </span>
            <p>
              <strong>{title}</strong>
              <small>{detail}</small>
            </p>
            <b>{action}</b>
          </button>
        ))}
      </div>

      <SectionTitle title="Performance" action="Full report" onClick={() => {}} />
      <section className="bv2-performance">
        <header>
          <div>
            <small>MATCHED CREATOR REACH</small>
            <strong>{compactCount(reach)}</strong>
          </div>
          <span>
            <Icon name="trending" size={13} /> 18.6%
          </span>
        </header>
        <div className="bv2-chart">
          <svg viewBox="0 0 350 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="bv2Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#16a46c" stopOpacity=".24" />
                <stop offset="1" stopColor="#16a46c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="bv2-area"
              d="M0 100c42-4 45-38 81-31s45 22 78-11 48 7 78-19 51-16 113-31v112H0Z"
            />
            <path
              className="bv2-line"
              d="M0 100c42-4 45-38 81-31s45 22 78-11 48 7 78-19 51-16 113-31"
            />
          </svg>
          <span>
            <b>2.1M</b> Jun 18
          </span>
        </div>
        <div className="bv2-performance-grid">
          {[
            [compactCount(reach), "Views"],
            [`${engagement.toFixed(1)}%`, "Engagement"],
            [String(creators.length), "Creators"],
            [String(counts.active), "Campaigns"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <SectionTitle title="Creator applications" action={`${counts.applications} open`} onClick={onExplore} />
      <div className="bv2-applications">
        {recommended.slice(0, 2).map((creator, index) => (
          <article key={creator.id}>
            <img src={creator.image} alt={creator.name} />
            <div>
              <span>{95 - index * 3}% MATCH</span>
              <strong>{creator.name}</strong>
              <small>
                {creator.niche} · {creator.followers}
              </small>
              <p>{featured?.title || "Open campaign"}</p>
            </div>
            <aside>
              <strong>{creator.price}</strong>
              <button>Review</button>
            </aside>
          </article>
        ))}
      </div>

      <SectionTitle title="Collaborating creators" action="View all" onClick={() => {}} />
      <div className="bv2-collaborators">
        {(bookings.length
          ? bookings
              .map((booking) => creators.find((creator) => creator.id === booking.creatorId))
              .filter((creator): creator is Creator => Boolean(creator))
          : recommended
        )
          .slice(0, 4)
          .map((creator, index) => (
          <button key={creator.id} onClick={() => onCreator(creator)}>
            <div>
              <img src={creator.image} alt={creator.name} />
              <i className={creator.available ? "" : "away"} />
            </div>
            <strong>{creator.name.split(" ")[0]}</strong>
            <small>{bookings[index]?.status || (creator.available ? "Available" : "Busy")}</small>
          </button>
        ))}
      </div>

      <section className="bv2-insight">
        <header>
          <span>
            <Icon name="sparkles" size={18} />
          </span>
          <div>
            <small>AI INSIGHT</small>
            <strong>A regional opportunity</strong>
          </div>
        </header>
        <h3>
          {recommended[0]
            ? `${recommended[0].name} in ${recommended[0].city} is your strongest match at ${recommended[0].match}%.`
            : "Add a campaign to see creator matches from your workspace."}
        </h3>
        <p>
          Based on {creators.length} live creator profiles
          {featured ? ` and ${featured.title}.` : "."}
        </p>
        <div>
          <button>Explore creators</button>
          <button>
            Ask AI <Icon name="arrow" size={13} />
          </button>
        </div>
      </section>

      <SectionTitle title="Recent activity" action="All activity" onClick={() => {}} />
      <div className="bv2-activity">
        {(messages.length
          ? messages.slice(0, 3).map((msg) => ["message", msg.preview, msg.campaign, msg.time] as const)
          : bookings.slice(0, 3).map(
              (booking) =>
                ["wallet", booking.deliverable, booking.date, booking.status] as const,
            )
        ).map(([icon, title, detail, time], index) => (
          <button key={title}>
            <span className={`tone-${index}`}>
              <Icon name={icon as IconName} size={15} />
            </span>
            <p>
              <strong>{title}</strong>
              <small>{detail}</small>
            </p>
            <time>{time}</time>
            <Icon name="chevron" size={12} />
          </button>
        ))}
      </div>

      <section className="bv2-assistant">
        <div className="bv2-assistant-head">
          <span>
            <Icon name="sparkles" size={19} />
          </span>
          <div>
            <small>ORBITLY AI</small>
            <strong>Your marketing assistant</strong>
          </div>
        </div>
        <div className="bv2-prompts">
          {[
            recommended[0] ? `Find creators like ${recommended[0].name.split(" ")[0]}` : "Find creators",
            featured ? `Review ${featured.title}` : "Plan a campaign",
            `Spend so far ${inrCompact(spend)}`,
          ].map((item) => (
            <button key={item} onClick={() => setPrompt(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="bv2-ai-input">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask anything about your growth…"
          />
          <button>
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <p>Recommendations are directional and require your confirmation.</p>
      </section>
    </div>
  );
}

