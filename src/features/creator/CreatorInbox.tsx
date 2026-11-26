import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { InboxMessage } from "../../types";

type InboxTab = "all" | "unread" | "campaigns";

export function CreatorInbox({
  onBack,
  onOpenThread,
}: {
  onBack: () => void;
  onOpenThread?: (threadId: string) => void;
}) {
  const [tab, setTab] = useState<InboxTab>("all");
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .listMessages(tab)
      .then((data) => {
        if (!alive) return;
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tab]);

  const filtered = messages.filter((msg) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return `${msg.campaign} ${msg.creatorName} ${msg.preview}`.toLowerCase().includes(q);
  });

  return (
    <div className="screen creator-overlay-screen creator-inbox-screen">
      <StatusBar />
      <header className="creator-overlay-head">
        <button
          className="round-button work-back-btn"
          type="button"
          onClick={onBack}
          aria-label="Back"
        >
          <Icon name="chevron" size={18} />
        </button>
        <div>
          <small>CONVERSATIONS</small>
          <h1>Messages</h1>
        </div>
        <button
          className={`round-button ${searchOpen ? "active" : ""}`}
          type="button"
          aria-label="Search messages"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Icon name="search" size={17} />
        </button>
      </header>
      {searchOpen && (
        <div className="mobile-search creator-search creator-inbox-search">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            autoFocus
          />
        </div>
      )}
      <div className="pills creator-pills creator-inbox-pills">
        <button type="button" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          All
        </button>
        <button
          type="button"
          className={tab === "unread" ? "active" : ""}
          onClick={() => setTab("unread")}
        >
          Unread{unreadCount ? ` · ${unreadCount}` : ""}
        </button>
        <button
          type="button"
          className={tab === "campaigns" ? "active" : ""}
          onClick={() => setTab("campaigns")}
        >
          Campaigns
        </button>
      </div>
      <div className="messages creator-messages">
        {filtered.map((msg) => (
          <button
            className={`message-row ${msg.unread > 0 ? "is-unread" : ""}`}
            type="button"
            key={msg.id}
            onClick={() => {
              if (!msg.threadId || !onOpenThread) return;
              if (msg.unread > 0) {
                void api
                  .markMessageRead(msg.id)
                  .then(() => {
                    setMessages((prev) =>
                      prev.map((m) => (m.id === msg.id ? { ...m, unread: 0 } : m)),
                    );
                    setUnreadCount((c) => Math.max(0, c - msg.unread));
                  })
                  .catch(() => {});
              }
              onOpenThread(msg.threadId);
            }}
          >
            <div className="message-avatar">
              {msg.creatorImage ? (
                <img src={msg.creatorImage} alt="" />
              ) : (
                <Icon name="briefcase" size={18} />
              )}
              {msg.unread > 0 && <i />}
            </div>
            <div className="message-copy">
              <strong>{msg.creatorName || msg.campaign || "Brand"}</strong>
              <p>{msg.preview}</p>
              <small>
                {msg.campaign || (msg.category === "campaigns" ? "Campaign thread" : "General")}
              </small>
            </div>
            <div className="message-meta">
              <span>{msg.time}</span>
              {msg.unread > 0 && <b>{msg.unread}</b>}
            </div>
          </button>
        ))}
        {!filtered.length && (
          <div className="empty-inline creator-inbox-empty">
            <h3>No messages yet</h3>
            <p>When a brand books you, the chat thread opens here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
