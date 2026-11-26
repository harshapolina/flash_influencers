import { Icon } from "../../lib/icons";
import type { AppFlow, BrandTab, IconName } from "../../types";
import { StatusBar } from "../../components/ui/StatusBar";
import { useAppStore } from "../../store/AppStore";

export function ProfileScreen({ onOpenFlow }: { onOpenFlow?: (flow: AppFlow) => void }) {
  const { state, resetSession } = useAppStore();
  return (
    <div className="screen profile-screen">
      <StatusBar />
      <header className="profile-top">
        <button
          className="round-button"
          type="button"
          aria-label="Open notifications"
          onClick={() => onOpenFlow?.({ name: "notifications", role: "brand" })}
        >
          <Icon name="bell" />
        </button>
        <div className="profile-photo">
          <span>
            {(state.user?.name || "OR")
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() || "")
              .join("")}
          </span>
        </div>
        <h1>{state.user?.name || "Brand"}</h1>
        <p>
          {(typeof state.user?.profile.company === "string" && state.user.profile.company) ||
            state.user?.email ||
            "Brand account"}
        </p>
        <span className="verified-account">
          <Icon name="shield" size={14} /> Business verified
        </span>
      </header>
      <div className="profile-numbers">
        <div>
          <strong>{state.bookings.length || 12}</strong>
          <span>Campaigns</span>
        </div>
        <div>
          <strong>{state.likedIds.length + state.savedIds.length || 38}</strong>
          <span>Saved</span>
        </div>
        <div>
          <strong>8</strong>
          <span>Team</span>
        </div>
      </div>
      <div className="profile-menu">
        {[
          ["Business profile", "user"],
          ["Payments & billing", "wallet"],
          ["Team management", "user"],
          ["Subscription", "sparkles"],
          ["Security & password", "shield"],
          ["Notifications", "bell"],
          ["Language & region", "pin"],
          ["Connected integrations", "link"],
          ["Appearance", "sparkles"],
          ["Help & support", "message"],
          ["About Orbitly", "user"],
        ].map(([label, icon]) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              onOpenFlow?.({
                name: label === "Notifications" ? "notifications" : "profile-section",
                role: "brand",
                title: label,
              })
            }
          >
            <span>
              <Icon name={icon as IconName} />
            </span>
            <strong>{label}</strong>
            {label === "Subscription" && <b>GROWTH</b>}
            <Icon name="chevron" size={16} />
          </button>
        ))}
        <button type="button" onClick={resetSession}>
          <span>
            <Icon name="close" />
          </span>
          <strong>Sign out</strong>
          <Icon name="chevron" size={16} />
        </button>
      </div>
    </div>
  );
}

export function BottomNav({ active, onChange }: { active: BrandTab; onChange: (t: BrandTab) => void }) {
  const tabs: [BrandTab, IconName][] = [
    ["Home", "home"],
    ["Explore", "search"],
    ["Campaigns", "briefcase"],
    ["Inbox", "message"],
    ["Profile", "user"],
  ];
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <span className="nav-liquid-glow" aria-hidden />
      {tabs.map(([label, icon]) => (
        <button
          className={active === label ? "active" : ""}
          onClick={() => onChange(label)}
          key={label}
          type="button"
          aria-label={label}
          aria-current={active === label ? "page" : undefined}
        >
          <span className="nav-icon-wrap">
            <Icon name={icon} size={20} fill={active === label} />
            {label === "Inbox" && <i>3</i>}
            <b className="nav-reflection" />
          </span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}
