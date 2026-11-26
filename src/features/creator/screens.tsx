import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import { creators } from "../../data";
import type { AppFlow, CreatorTab, IconName } from "../../types";

export { CreatorHomeScreen } from "./CreatorHomeMake";

export function CreatorAppProfile({ onOpen }: { onOpen?: (flow: AppFlow) => void } = {}) {
  return (
    <div className="screen creator-app-profile">
      <StatusBar />
      <header className="creator-profile-hero">
        <button
          className="round-button"
          onClick={() => onOpen?.({ name: "notifications", role: "creator" })}
          aria-label="Open notifications"
        >
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
        <button
          className="edit-creator-profile"
          onClick={() =>
            onOpen?.({ name: "profile-section", role: "creator", title: "Edit profile" })
          }
        >
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
          ["Security & password", "shield"],
          ["Notifications", "bell"],
          ["Settings & privacy", "filter"],
          ["Language & region", "pin"],
          ["Connected apps", "link"],
          ["Appearance", "sparkles"],
          ["Creator support", "message"],
          ["About Orbitly", "user"],
        ].map(([label, icon]) => (
          <button
            key={label}
            onClick={() => onOpen?.({ name: "profile-section", role: "creator", title: label })}
          >
            <span>
              <Icon name={icon as IconName} size={17} />
            </span>
            <strong>{label}</strong>
            {label === "Verification" && <b>VERIFIED</b>}
            <Icon name="chevron" size={15} />
          </button>
        ))}
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
