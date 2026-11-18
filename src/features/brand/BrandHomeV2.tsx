import { useState } from "react";
import { creators } from "../../data";
import { Icon } from "../../lib/icons";
import type { Creator, IconName } from "../../types";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { useAppStore } from "../../store/AppStore";

export function BrandHomeV2({
  onExplore,
  onCreator,
}: {
  onExplore: () => void;
  onCreator: (creator: Creator) => void;
}) {
  const { state, toggleLike } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const saved = state.likedIds;
  const toggleSave = toggleLike;

  return (
    <div className="screen brand-v2">
      <StatusBar />

      <header className="bv2-header">
        <div className="bv2-location">
          <small>WORKSPACE</small>
          <strong>
            The Loom <Icon name="chevron" size={13} />
          </strong>
        </div>
        <button className="bv2-icon-button">
          <Icon name="bell" size={18} />
          <i />
        </button>
        <button className="bv2-avatar">NK</button>
      </header>

      <div className="bv2-search">
        <Icon name="search" size={19} />
        <input placeholder="Search creators, campaigns…" />
        <button>
          <Icon name="filter" size={17} />
        </button>
      </div>

      <section className="bv2-greeting">
        <span>Good morning, Neha</span>
        <h1>
          Grow your brand
          <br />
          with the right <em>voices.</em>
        </h1>
        <p>Three items need your attention today.</p>
      </section>

      <div className="bv2-chips">
        <button className="active">Overview</button>
        <button>
          Approvals <b>3</b>
        </button>
        <button>
          Applications <b>8</b>
        </button>
        <button>Reports</button>
      </div>

      <section className="bv2-featured">
        <img
          src="https://images.unsplash.com/photo-1723218624898-2089a034fd36?crop=faces&fit=crop&w=850&h=600&q=88"
          alt="Summer Edit fashion campaign"
        />
        <div className="bv2-featured-shade" />
        <span className="bv2-live">
          <i /> ACTIVE CAMPAIGN
        </span>
        <button className="bv2-save">
          <Icon name="bookmark" size={17} />
        </button>
        <div className="bv2-featured-copy">
          <small>SUMMER EDIT 2025</small>
          <h2>
            Colour made
            <br />
            for every day.
          </h2>
          <div>
            <span>
              <Icon name="user" size={13} /> 8 creators
            </span>
            <span>
              <Icon name="calendar" size={13} /> Due 28 Jun
            </span>
          </div>
        </div>
        <div className="bv2-campaign-progress">
          <div>
            <span>Campaign progress</span>
            <strong>72%</strong>
          </div>
          <i>
            <b />
          </i>
          <button>
            Manage campaign <Icon name="arrow" size={14} />
          </button>
        </div>
      </section>

      <div className="bv2-stat-scroll">
        {[
          ["12", "Active campaigns", "briefcase"],
          ["38", "Creators", "user"],
          ["₹4.2L", "Total spend", "wallet"],
          ["3", "Pending approval", "clock"],
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
        {creators.slice(0, 3).map((creator) => (
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
        {[
          ["camera", "Review 3 submissions", "Summer Edit · received today", "Review", "lavender"],
          ["user", "8 creator applications", "Monsoon Stories · closes Friday", "View", "green"],
          ["wallet", "Payment due tomorrow", "Everyday Active · ₹42,000", "Pay", "orange"],
        ].map(([icon, title, detail, action, tone]) => (
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
            <small>TOTAL REACH</small>
            <strong>8.42M</strong>
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
            ["6.8M", "Views"],
            ["412K", "Engagement"],
            ["28.4K", "Clicks"],
            ["1,842", "Conversions"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <SectionTitle title="Creator applications" action="8 new" onClick={() => {}} />
      <div className="bv2-applications">
        {creators.slice(0, 2).map((creator, index) => (
          <article key={creator.id}>
            <img src={creator.image} alt={creator.name} />
            <div>
              <span>{95 - index * 3}% MATCH</span>
              <strong>{creator.name}</strong>
              <small>
                {creator.niche} · {creator.followers}
              </small>
              <p>Summer Edit 2025</p>
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
        {creators.map((creator, index) => (
          <button key={creator.id} onClick={() => onCreator(creator)}>
            <div>
              <img src={creator.image} alt={creator.name} />
              <i className={index === 2 ? "away" : ""} />
            </div>
            <strong>{creator.name.split(" ")[0]}</strong>
            <small>{["Submitted", "Creating", "Awaiting", "Approved"][index]}</small>
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
        <h3>Telugu lifestyle creators are outperforming your category by 1.8×.</h3>
        <p>Based on audience overlap and 42 recent fashion campaigns.</p>
        <div>
          <button>Explore creators</button>
          <button>
            Ask AI <Icon name="arrow" size={13} />
          </button>
        </div>
      </section>

      <SectionTitle title="Recent activity" action="All activity" onClick={() => {}} />
      <div className="bv2-activity">
        {[
          ["check", "Aarohi accepted your invitation", "Summer Edit 2025", "12m"],
          ["camera", "Rhea submitted a final reel", "Monsoon Stories", "1h"],
          ["wallet", "Payment processed", "Everyday Active · ₹18K", "1d"],
        ].map(([icon, title, detail, time], index) => (
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
          {["Find Telugu creators", "Plan a ₹50K launch", "Analyze Summer Edit"].map((item) => (
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

