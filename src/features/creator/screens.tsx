import { Icon } from "../../lib/icons";
import type { CreatorTab, IconName } from "../../types";
import { campaigns, creators } from "../../data";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { useAppStore } from "../../store/AppStore";

export function CreatorHomeScreen({
  onExplore,
  onWork,
}: {
  onExplore: () => void;
  onWork?: () => void;
}) {
  return (
    <div className="screen creator-home-screen">
      <StatusBar />
      <header className="creator-home-head">
        <div className="creator-head-avatar">
          <img src={creators[0].image} alt="Aarohi Mehta" />
          <i />
        </div>
        <div>
          <small>GOOD MORNING</small>
          <strong>
            Aarohi Mehta{" "}
            <span>
              <Icon name="check" size={8} />
            </span>
          </strong>
        </div>
        <button className="round-button">
          <Icon name="bell" size={19} />
          <i />
        </button>
      </header>

      <section className="creator-wallet-hero">
        <div className="wallet-copy">
          <span>
            <Icon name="wallet" size={14} /> AVAILABLE BALANCE
          </span>
          <strong>₹84,320</strong>
          <p>
            <b>+₹21,400</b> earned this month
          </p>
          <button>
            Withdraw earnings <Icon name="arrow" size={14} />
          </button>
        </div>
        <div className="wallet-visual">
          <img src={creators[0].image} alt="" />
          <span className="wallet-float wf-one">
            <Icon name="trending" size={11} /> +18%
          </span>
          <span className="wallet-float wf-two">
            <Icon name="check" size={10} /> Paid
          </span>
          <i className="wallet-orbit" />
        </div>
      </section>

      <section className="creator-profile-strength">
        <div className="strength-ring">
          <strong>92</strong>
          <small>%</small>
        </div>
        <div>
          <span>PROFILE STRENGTH</span>
          <strong>Your profile stands out</strong>
          <small>Add one more portfolio sample to reach 100%.</small>
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
          <strong>4</strong>
          <small>Active work</small>
        </div>
        <div>
          <span className="kpi-icon purple">
            <Icon name="search" size={16} />
          </span>
          <strong>18</strong>
          <small>New matches</small>
        </div>
        <div>
          <span className="kpi-icon peach">
            <Icon name="trending" size={16} />
          </span>
          <strong>6.8%</strong>
          <small>Engagement</small>
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
                {96 - index * 3}% match
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
        <div className="active-work-brand">TL</div>
        <div className="active-work-copy">
          <span>THE LOOM · SUMMER EDIT</span>
          <strong>Final reel due tomorrow</strong>
          <div className="work-progress">
            <i />
          </div>
          <small>3 of 4 milestones complete</small>
        </div>
        <button>
          <Icon name="chevron" size={15} />
        </button>
      </section>

      <SectionTitle title="This month" action="Analytics" onClick={() => {}} />
      <section className="creator-performance-card">
        <div>
          <span>CONTENT REACH</span>
          <strong>1.84M</strong>
          <small>
            <b>+24%</b> vs last month
          </small>
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

export function CreatorAppProfile() {
  const { resetSession } = useAppStore();
  return (
    <div className="screen creator-app-profile">
      <StatusBar />
      <header className="creator-profile-hero">
        <button className="round-button" type="button">
          <Icon name="bell" size={18} />
        </button>
        <div className="creator-profile-image">
          <img src={creators[0].image} alt="Aarohi Mehta" />
          <span>
            <Icon name="check" size={10} />
          </span>
        </div>
        <h1>Aarohi Mehta</h1>
        <p>@aarohi.edits · Mumbai</p>
        <div className="creator-profile-tags">
          <span>Fashion</span>
          <span>Beauty</span>
          <span>Lifestyle</span>
        </div>
        <button className="edit-creator-profile" type="button">
          Edit profile
        </button>
      </header>
      <div className="creator-profile-stats">
        <div>
          <strong>248K</strong>
          <span>Followers</span>
        </div>
        <div>
          <strong>5.8%</strong>
          <span>Engagement</span>
        </div>
        <div>
          <strong>4.9</strong>
          <span>Rating</span>
        </div>
      </div>
      <div className="profile-strength-card">
        <span>PROFILE COMPLETION</span>
        <div>
          <i style={{ width: "92%" }} />
        </div>
        <p>
          <strong>92% complete</strong>
          <small>Add a new portfolio sample</small>
        </p>
      </div>
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
          <button key={label} type="button">
            <span>
              <Icon name={icon as IconName} size={17} />
            </span>
            <strong>{label}</strong>
            {label === "Verification" && <b>VERIFIED</b>}
            <Icon name="chevron" size={15} />
          </button>
        ))}
        <button type="button" onClick={resetSession}>
          <span>
            <Icon name="close" size={17} />
          </span>
          <strong>Sign out / reset demo</strong>
          <Icon name="chevron" size={15} />
        </button>
      </div>
    </div>
  );
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
            {label === "Opportunities" && <i>18</i>}
            <b className="nav-reflection" />
          </span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}
