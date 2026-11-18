import { useEffect, useState } from "react";
import { creators } from "../../data";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { InboxMessage } from "../../types";

type InboxTab = "all" | "unread" | "campaigns";

export function InboxScreen() {
  const [tab, setTab] = useState<InboxTab>("all");
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .listMessages(tab)
      .then((data) => {
        if (!alive) return;
        setMessages(data.messages);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tab]);

  return (
    <div className="screen simple-screen">
      <StatusBar />
      <header className="simple-head">
        <div>
          <small>CONVERSATIONS</small>
          <h1>Inbox</h1>
        </div>
        <button className="round-button" type="button">
          <Icon name="search" />
        </button>
      </header>
      <div className="pills inbox-pills">
        <button type="button" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          All
        </button>
        <button
          type="button"
          className={tab === "unread" ? "active" : ""}
          onClick={() => setTab("unread")}
        >
          Unread {unreadCount}
        </button>
        <button
          type="button"
          className={tab === "campaigns" ? "active" : ""}
          onClick={() => setTab("campaigns")}
        >
          Campaigns
        </button>
      </div>
      <div className="messages">
        {messages.map((msg) => {
          const creator = creators.find((c) => c.id === msg.creatorId) ?? creators[0];
          return (
            <div className="message-row" key={msg.id}>
              <div className="message-avatar">
                <img src={creator.image} alt="" />
                {msg.unread > 0 && <i />}
              </div>
              <div>
                <strong>{creator.name}</strong>
                <p>{msg.preview}</p>
                <small>{msg.campaign}</small>
              </div>
              <span>{msg.time}</span>
              {msg.unread > 0 && <b>{msg.unread}</b>}
            </div>
          );
        })}
        {!messages.length && (
          <div className="empty" style={{ paddingTop: 48 }}>
            <h3>No messages</h3>
            <p>You’re all caught up in this tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}
