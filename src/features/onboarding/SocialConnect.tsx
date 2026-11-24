import { useEffect, useState } from "react";
import { api, type SocialAccount } from "../../lib/api";
import { Icon } from "../../lib/icons";
import type { IconName } from "../../types";

const PLATFORMS: { id: "instagram" | "youtube"; name: string; icon: IconName; color: string }[] = [
  { id: "instagram", name: "Instagram", icon: "instagram", color: "instagram" },
  { id: "youtube", name: "YouTube", icon: "youtube", color: "youtube" },
];

function formatCount(value?: number) {
  if (!value) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

export function SocialConnect() {
  const [accounts, setAccounts] = useState<Record<string, SocialAccount>>({});
  const [open, setOpen] = useState<"instagram" | "youtube" | null>(null);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = () => {
    api
      .me()
      .then(({ user }) => {
        const social = user.profile?.social;
        setAccounts(social && typeof social === "object" ? (social as Record<string, SocialAccount>) : {});
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAccounts();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "orbitly-instagram") return;
      setBusy(false);
      if (event.data.ok) {
        setOpen(null);
        setError("");
        loadAccounts();
      } else if (event.data.error) {
        setError(String(event.data.error));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const connectInstagram = async () => {
    setBusy(true);
    setError("");
    try {
      const { url } = await api.instagramAuthUrl();
      const popup = window.open(url, "orbitly-instagram", "popup,width=480,height=760");
      if (!popup) {
        window.location.href = url;
        return;
      }
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          setBusy(false);
          loadAccounts();
        }
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Instagram did not open");
      setBusy(false);
    }
  };

  const connect = async () => {
    if (!open || handle.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const { account, user } = await api.connectSocial({ platform: open, handle: handle.trim() });
      const social = (user.profile?.social || { [account.platform]: account }) as Record<string, SocialAccount>;
      setAccounts(social);
      setOpen(null);
      setHandle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect that account");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async (platform: "instagram" | "youtube") => {
    setBusy(true);
    setError("");
    try {
      const { user } = await api.disconnectSocial(platform);
      setAccounts((user.profile?.social || {}) as Record<string, SocialAccount>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect");
    } finally {
      setBusy(false);
    }
  };

  const connected = PLATFORMS.filter((item) => accounts[item.id]);

  return (
    <div className="social-connections">
      <div className="social-account-list">
        {PLATFORMS.map((platform) => {
          const account = accounts[platform.id];
          return (
            <article className={account ? "connected" : ""} key={platform.id}>
              <span className={`social-app-icon ${platform.color}`}>
                <Icon name={platform.icon} size={21} />
              </span>
              <div>
                <strong>{platform.name}</strong>
                <small>
                  {account
                    ? account.handle
                    : platform.id === "instagram"
                      ? "Log in on Instagram and approve access"
                      : "Connect your public channel"}
                </small>
                {account && (
                  <em>
                    {formatCount(account.followers)} {platform.id === "youtube" ? "subscribers" : "followers"}
                    {account.following ? ` · ${formatCount(account.following)} following` : ""}
                    {account.viewRate ? ` · ${account.viewRate}% view rate` : ""}
                  </em>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setError("");
                  if (platform.id === "instagram" && !account) {
                    void connectInstagram();
                    return;
                  }
                  setHandle(account?.handle.replace(/^@/, "") || "");
                  setOpen(platform.id);
                }}
              >
                {account ? "Manage" : "Connect"}
              </button>
            </article>
          );
        })}
      </div>

      {error && !open && <p className="flow-error">{error}</p>}

      {open && (
        <div className="field-stack" style={{ marginTop: 14 }}>
          {open === "instagram" ? (
            <p className="flow-error" style={{ color: "inherit" }}>
              Instagram opens its own login. You approve Orbitly there, and only then are followers, following, and recent posts imported. Orbitly never asks for your Instagram password.
            </p>
          ) : (
            <label>
              YOUTUBE HANDLE
              <input
                value={handle}
                placeholder="channelname"
                onChange={(event) => setHandle(event.target.value)}
              />
            </label>
          )}
          {error && <p className="flow-error">{error}</p>}
          <button
            className="flow-primary"
            type="button"
            disabled={busy}
            onClick={open === "instagram" ? connectInstagram : connect}
          >
            {busy
              ? open === "instagram"
                ? "Waiting for Instagram…"
                : "Checking the channel…"
              : open === "instagram"
                ? "Continue with Instagram"
                : "Verify and connect"}
          </button>
          {accounts[open] && (
            <button className="face-back-action" type="button" disabled={busy} onClick={() => disconnect(open)}>
              Disconnect
            </button>
          )}
        </div>
      )}

      {connected.length > 0 && (
        <div className="social-data-preview">
          <header>
            <div>
              <span>PUBLIC PROFILE</span>
              <strong>Imported from the account you connected</strong>
            </div>
          </header>
          {connected.map((platform) => {
            const account = accounts[platform.id];
            return (
              <div key={platform.id}>
                <p>
                  <strong>{account.name}</strong> · {formatCount(account.followers)} · {account.posts || 0} posts
                </p>
                {account.topPosts?.slice(0, 3).map((post) => (
                  <p key={post.url}>
                    <a href={post.url} target="_blank" rel="noreferrer">
                      {post.title || "Post"}
                    </a>
                    {post.views ? ` · ${formatCount(post.views)} views` : ""}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
