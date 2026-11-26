import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { InboxMessage, WorkItem } from "../../types";

export function CreatorNotifications({
  onBack,
  onOpenThread,
  onOpenWork,
  onOpenEarnings,
}: {
  onBack: () => void;
  onOpenThread?: (threadId: string) => void;
  onOpenWork?: () => void;
  onOpenEarnings?: () => void;
}) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [work, setWork] = useState<WorkItem[]>([]);
  const [tab, setTab] = useState<"all" | "campaigns" | "payouts">("all");
  const [filterKind, setFilterKind] = useState<"all" | "unread">("all");

  useEffect(() => {
    let alive = true;
    Promise.all([api.listMessages("all"), api.myWork()])
      .then(([inbox, jobs]) => {
        if (!alive) return;
        setMessages(inbox.messages || []);
        setWork(jobs.items || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const payoutNotes = work
    .filter((item) => /paid|payout|complete/i.test(item.status))
    .map((item) => ({
      id: `work-${item.id}`,
      title: item.brand,
      body: `${item.title} · ${item.status}`,
      time: item.due,
      kind: "payout" as const,
      earningsJump: true,
    }));

  const inviteNotes = work
    .filter((item) => item.needsAccept || item.bookingId)
    .map((item) => ({
      id: `invite-${item.id}`,
      title: item.brand,
      body: item.needsAccept
        ? `${item.title} · Waiting for your OK`
        : `${item.title} · ${item.status}`,
      time: item.due,
      kind: "campaign" as const,
      threadId: item.threadId,
      workJump: true,
    }));

  const campaignNotes = messages.map((msg) => ({
    id: msg.id,
    title: msg.creatorName || msg.campaign || "Campaign update",
    body: msg.preview,
    time: msg.time,
    kind: "campaign" as const,
    unread: msg.unread,
    threadId: msg.threadId,
  }));

  const all = [...inviteNotes, ...campaignNotes, ...payoutNotes];
  let list =
    tab === "campaigns"
      ? [...inviteNotes, ...campaignNotes]
      : tab === "payouts"
        ? payoutNotes
        : all;

  if (filterKind === "unread") {
    list = list.filter((item) => ("unread" in item && item.unread) || ("workJump" in item && item.workJump));
  }

  return (
    <div className="screen creator-overlay-screen creator-notifications-screen">
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
          <small>UPDATES</small>
          <h1>Notifications</h1>
        </div>
        <button
          className={`round-button ${filterKind === "unread" ? "active" : ""}`}
          type="button"
          aria-label={filterKind === "unread" ? "Show all" : "Show unread"}
          onClick={() => setFilterKind((v) => (v === "all" ? "unread" : "all"))}
        >
          <Icon name="filter" size={17} />
        </button>
      </header>
      <div className="pills creator-pills creator-notif-pills">
        {(
          [
            ["all", "All"],
            ["campaigns", "Campaigns"],
            ["payouts", "Payouts"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="creator-notif-list">
        {list.map((item) => {
          const unread = "unread" in item && item.unread ? Number(item.unread) : 0;
          return (
            <button
              key={item.id}
              type="button"
              className={`creator-notif-row ${unread ? "is-unread" : ""}`}
              onClick={() => {
                if (unread) {
                  void api.markMessageRead(item.id).then(() =>
                    setMessages((prev) =>
                      prev.map((m) => (m.id === item.id ? { ...m, unread: 0 } : m)),
                    ),
                  );
                }
                if ("threadId" in item && item.threadId && onOpenThread) {
                  onOpenThread(item.threadId);
                  return;
                }
                if ("workJump" in item && item.workJump && onOpenWork) {
                  onOpenWork();
                  return;
                }
                if ("earningsJump" in item && item.earningsJump && onOpenEarnings) {
                  onOpenEarnings();
                }
              }}
            >
              <span className={`notif-icon ${item.kind}`}>
                <Icon name={item.kind === "payout" ? "wallet" : "briefcase"} size={16} />
              </span>
              <div className="notif-copy">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>{item.time || "Just now"}</small>
              </div>
              {unread > 0 ? <b>{unread}</b> : <Icon name="chevron" size={14} />}
            </button>
          );
        })}
        {!list.length && (
          <div className="empty-inline creator-notif-empty">
            <h3>You’re all caught up</h3>
            <p>Brand bookings and payout updates will show here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
