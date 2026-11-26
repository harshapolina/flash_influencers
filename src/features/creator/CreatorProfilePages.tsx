import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import { useAppStore } from "../../store/AppStore";
import type { SocialAccount } from "../../lib/api";

export type CreatorProfilePageId =
  | "Public profile"
  | "Portfolio"
  | "Social accounts"
  | "Pricing & packages"
  | "Availability"
  | "Verification"
  | "Settings & privacy"
  | "Creator support"
  | "Analytics";

function socialAccounts(profile?: Record<string, unknown>) {
  const social = profile?.social;
  if (!social || typeof social !== "object") return [];
  return Object.values(social as Record<string, SocialAccount>);
}

function formatCount(value?: number) {
  if (!value) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

export function CreatorProfilePage({
  page,
  onBack,
  onOpenEarnings,
  onOpenWork,
}: {
  page: CreatorProfilePageId;
  onBack: () => void;
  onOpenEarnings?: () => void;
  onOpenWork?: () => void;
}) {
  const { state, resetSession } = useAppStore();
  const fields = (state.user?.profile?.fields || {}) as Record<string, string>;
  const answers = (state.user?.profile?.answers || {}) as Record<string, string[]>;
  const supportEmail = "support@orbitly.app";
  const openSupport = (topic: string) => {
    const subject = encodeURIComponent(`Orbitly creator help · ${topic}`);
    const body = encodeURIComponent(
      `Hi Orbitly team,\n\nI need help with: ${topic}\nCreator: ${state.user?.name || ""}\nEmail: ${state.user?.email || ""}\n\nDetails:\n`,
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };
  const accounts = socialAccounts(state.user?.profile);
  const name =
    fields["Personal Information:DISPLAY NAME"] || state.user?.name || "Creator";
  const handle =
    accounts[0]?.handle ||
    fields["Personal Information:CREATOR USERNAME"] ||
    state.user?.email ||
    "";
  const city = fields["Location Details:LOCATION"] || "Location not added";
  const avatar =
    accounts.find((account) => account.avatar)?.avatar || state.user?.avatarUrl || "";
  const price = fields["Pricing Preferences:AMOUNT"];
  const portfolio = fields["Content Portfolio:LINK"];
  const schedule = fields["Availability:SCHEDULE"];
  const tags = Array.from(
    new Set([...(answers["Creator Category"] || []), ...(answers["Content Categories"] || [])]),
  ).slice(0, 4);

  return (
    <div className="screen creator-overlay-screen creator-profile-page">
      <StatusBar />
      <header className="creator-overlay-head">
        <button className="round-button" type="button" onClick={onBack} aria-label="Back">
          <Icon name="chevron" size={18} />
        </button>
        <div>
          <small>PROFILE</small>
          <h1>{page}</h1>
        </div>
        <span className="earnings-ledger-spacer" />
      </header>

      {page === "Public profile" && (
        <section className="creator-page-card profile-public-card">
          <div className="creator-profile-image">
            {avatar ? <img src={avatar} alt={name} /> : <Icon name="user" size={28} />}
            {state.user?.emailVerified && (
              <span>
                <Icon name="check" size={10} />
              </span>
            )}
          </div>
          <h2>{name}</h2>
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
          <div className="creator-profile-stats in-card">
            <div>
              <strong>
                {formatCount(accounts.reduce((sum, a) => sum + (a.followers || 0), 0))}
              </strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{accounts.length}</strong>
              <span>Connected</span>
            </div>
            <div>
              <strong>{price ? `₹${Number(price).toLocaleString("en-IN")}` : "—"}</strong>
              <span>Starting at</span>
            </div>
          </div>
          <p className="page-note">
            This is how brands see you when they open your Orbitly profile from a brief.
          </p>
        </section>
      )}

      {page === "Portfolio" && (
        <section className="creator-page-card">
          <h2>Featured work</h2>
          <p>Links and samples brands can review before booking you.</p>
          {portfolio ? (
            <a className="portfolio-link" href={portfolio} target="_blank" rel="noreferrer">
              <Icon name="link" size={16} />
              <strong>{portfolio}</strong>
              <Icon name="chevron" size={14} />
            </a>
          ) : (
            <div className="empty-inline">
              <h3>No portfolio yet</h3>
              <p>Add a drive, Behance, or site link during onboarding.</p>
            </div>
          )}
        </section>
      )}

      {page === "Social accounts" && (
        <section className="creator-page-card">
          <h2>Connected channels</h2>
          <p className="page-note">Tap a channel to open it externally and confirm ownership.</p>
          <div className="creator-profile-menu flat profile-social-list">
            {accounts.map((account) => (
              <a key={account.platform} href={account.url} target="_blank" rel="noreferrer">
                <span>
                  <Icon
                    name={account.platform === "youtube" ? "youtube" : "instagram"}
                    size={17}
                  />
                </span>
                <div className="profile-social-copy">
                  <strong>{account.name || account.handle || account.platform}</strong>
                  <small>
                    {account.platform === "youtube" ? "YouTube" : "Instagram"}
                    {account.handle ? ` · ${account.handle}` : ""}
                    {" · "}
                    {formatCount(account.followers)}{" "}
                    {(account.followers || 0) === 1 ? "follower" : "followers"}
                    {account.viewRate ? ` · ${account.viewRate}% views` : ""}
                  </small>
                </div>
                <Icon name="chevron" size={15} />
              </a>
            ))}
            {!accounts.length && (
              <div className="empty-inline">
                <h3>No accounts connected</h3>
                <p>Connect Instagram or YouTube to unlock match scoring.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {page === "Pricing & packages" && (
        <section className="creator-page-card">
          <h2>Starting packages</h2>
          <div className="pricing-grid">
            {[
              ["Reel", price],
              ["Story set", price ? String(Math.round(Number(price) * 0.45)) : ""],
              ["UGC video", price ? String(Math.round(Number(price) * 1.2)) : ""],
            ].map(([label, amount]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>
                  {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Not set"}
                </strong>
              </div>
            ))}
          </div>
          <p className="page-note">
            Brands see these as starting points. Final fees stay negotiable per brief.
          </p>
        </section>
      )}

      {page === "Availability" && (
        <section className="creator-page-card">
          <h2>Booking window</h2>
          {schedule ? (
            <>
              <div className="availability-pill">
                <Icon name="calendar" size={16} />
                <strong>Schedule saved</strong>
              </div>
              <p className="page-note">{schedule}</p>
            </>
          ) : (
            <div className="empty-inline">
              <h3>No availability set</h3>
              <p>Add working days in onboarding so brands know when to book.</p>
            </div>
          )}
        </section>
      )}

      {page === "Verification" && (
        <section className="creator-page-card">
          <h2>Trust & safety</h2>
          <div className="verify-rows">
            <div>
              <Icon name="shield" size={16} />
              <div>
                <strong>Email</strong>
                <small>{state.user?.email}</small>
              </div>
              <b>{state.user?.emailVerified ? "Verified" : "Pending"}</b>
            </div>
            <div>
              <Icon name="instagram" size={16} />
              <div>
                <strong>Social ownership</strong>
                <small>{accounts.length ? `${accounts.length} connected` : "Not connected"}</small>
              </div>
              <b>{accounts.length ? "Linked" : "Open"}</b>
            </div>
          </div>
        </section>
      )}

      {page === "Settings & privacy" && (
        <section className="creator-page-card">
          <h2>Account</h2>
          <div className="settings-rows">
            <div>
              <span>Signed in as</span>
              <strong>{state.user?.email}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>Creator</strong>
            </div>
            <div>
              <span>Auth</span>
              <strong>{state.user?.authProvider || "password"}</strong>
            </div>
          </div>
          <button className="flow-primary" type="button" onClick={resetSession}>
            Sign out <Icon name="arrow" size={15} />
          </button>
        </section>
      )}

      {page === "Creator support" && (
        <section className="creator-page-card">
          <h2>Need help?</h2>
          <p className="page-note">
            Write to the address on your account email and include your creator handle. Typical reply
            window is one business day.
          </p>
          <div className="support-actions">
            <button type="button" onClick={() => openSupport("Campaign issues")}>
              <Icon name="message" size={16} />
              Campaign issues
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenEarnings) onOpenEarnings();
                else openSupport("Payout help");
              }}
            >
              <Icon name="wallet" size={16} />
              Payout help
            </button>
            <button type="button" onClick={() => openSupport("Safety report")}>
              <Icon name="shield" size={16} />
              Safety report
            </button>
            <button type="button" onClick={() => onOpenWork?.()}>
              <Icon name="briefcase" size={16} />
              Open my work
            </button>
          </div>
        </section>
      )}

      {page === "Analytics" && (
        <section className="creator-page-card">
          <h2>This month</h2>
          <div className="creator-performance-card stacked">
            {accounts.length === 0 && <p>Connect Instagram or YouTube to see analytics.</p>}
            {accounts.map((account) => (
              <div key={account.platform}>
                <span>{account.platform.toUpperCase()}</span>
                <strong>{formatCount(account.followers)} followers</strong>
                <small>
                  {account.views ? `${formatCount(account.views)} avg views` : "No view count yet"}
                  {"viewRate" in account && account.viewRate
                    ? ` · ${account.viewRate}% view rate`
                    : ""}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
