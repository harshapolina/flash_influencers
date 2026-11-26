import { useEffect, useState } from "react";
import { creators } from "../../data";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import { StatusBar } from "../../components/ui/StatusBar";
import type { AppFlow, Creator, InboxMessage } from "../../types";

export function InboxScreen({
  initialCreatorId = null,
  onCloseChat,
  onOpen,
}: {
  initialCreatorId?: number | null;
  onCloseChat?: () => void;
  onOpen?: (flow: AppFlow) => void;
} = {}) {
  const { state } = useAppStore();
  const creatorPool = state.creatorsCache.length ? state.creatorsCache : creators;
  const [activeCreator, setActiveCreator] = useState<Creator | null>(
    creatorPool.find((creator) => creator.id === initialCreatorId) ?? null,
  );
  const [message, setMessage] = useState("");
  const [threadLines, setThreadLines] = useState<
    { id: string; text: string; createdAt: string; mine: boolean }[]
  >([]);
  const [contextOpen, setContextOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [conversationFilter, setConversationFilter] = useState("All");
  const [apiMessages, setApiMessages] = useState<InboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (initialCreatorId) {
      setActiveCreator(
        creatorPool.find((creator) => creator.id === initialCreatorId) ?? creatorPool[0],
      );
    }
  }, [initialCreatorId, creatorPool]);

  useEffect(() => {
    let alive = true;
    api
      .listMessages("all")
      .then((data) => {
        if (!alive) return;
        setApiMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeCreator) {
      setThreadLines([]);
      return;
    }
    let alive = true;
    api
      .listChatThread(activeCreator.id)
      .then((data) => {
        if (!alive) return;
        setThreadLines(data.lines || []);
      })
      .catch(() => {
        if (alive) setThreadLines([]);
      });
    return () => {
      alive = false;
    };
  }, [activeCreator?.id]);

  const closeChat = () => {
    setActiveCreator(null);
    onCloseChat?.();
  };

  const sendMessage = () => {
    const cleanMessage = message.trim();
    if (!cleanMessage || !activeCreator) return;
    setMessage("");
    void api
      .sendChatMessage(activeCreator.id, cleanMessage)
      .then((data) => {
        setThreadLines((items) => [...items, data.line]);
        setApiMessages((prev) => {
          const rest = prev.filter((m) => m.creatorId !== activeCreator.id);
          return [
            {
              id: data.line.id,
              creatorId: activeCreator.id,
              creatorName: activeCreator.name,
              creatorImage: activeCreator.image,
              preview: cleanMessage,
              campaign: "Direct message",
              time: "now",
              unread: 0,
              category: "general" as const,
            },
            ...rest,
          ];
        });
      })
      .catch(() => {
        setMessage(cleanMessage);
      });
  };

  return (
    <div className="screen simple-screen">
      <StatusBar />
      <header className="simple-head">
        <div>
          <small>CONVERSATIONS</small>
          <h1>Inbox</h1>
        </div>
        <button
          className="round-button"
          onClick={() => setSearchOpen((open) => !open)}
          aria-label="Search conversations"
        >
          <Icon name="search" />
        </button>
      </header>
      {searchOpen && (
        <div className="mobile-search inbox-search-field">
          <Icon name="search" size={17} />
          <input autoFocus placeholder="Search conversations" />
        </div>
      )}
      <div className="pills inbox-pills">
        {[
          "All",
          `Unread ${unreadCount || apiMessages.filter((m) => m.unread > 0).length}`,
          "Campaigns",
        ].map((filter) => (
          <button
            className={conversationFilter === filter ? "active" : ""}
            onClick={() => setConversationFilter(filter)}
            key={filter}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="messages">
        {(apiMessages.length
          ? apiMessages.filter((msg) => {
              if (conversationFilter.startsWith("Unread")) return msg.unread > 0;
              if (conversationFilter === "Campaigns") return msg.category === "campaigns";
              return true;
            })
          : creatorPool.slice(0, 3).map((c, i) => ({
              id: `local-${c.id}`,
              creatorId: c.id,
              creatorName: c.name,
              creatorImage: c.image,
              preview:
                i === 0
                  ? "I’ve uploaded the revised cut for review."
                  : i === 1
                    ? "Thanks! The 28th works perfectly."
                    : "Your payment has been processed.",
              campaign: i === 0 ? "Summer Edit 2025" : "Monsoon Stories",
              time: i === 0 ? "2m" : i === 1 ? "1h" : "Yesterday",
              unread: i === 0 ? 2 : 0,
              category: "campaigns" as const,
            }))
        ).map((msg) => {
          const creator =
            creatorPool.find((c) => c.id === msg.creatorId) ||
            ({
              id: msg.creatorId,
              name: msg.creatorName || "Creator",
              image: msg.creatorImage || "",
              handle: "",
              city: "",
              niche: "",
              followers: "",
              followersCount: 0,
              engagement: "",
              views: "",
              price: "",
              priceValue: 0,
              match: 0,
              available: true,
              category: "influencer" as const,
              tags: [],
            } satisfies Creator);
          return (
            <button
              className="message-row"
              key={msg.id}
              type="button"
              onClick={() => {
                setActiveCreator(creator);
                if (msg.unread > 0) {
                  void api.markMessageRead(msg.id).then(() => {
                    setApiMessages((prev) =>
                      prev.map((item) => (item.id === msg.id ? { ...item, unread: 0 } : item)),
                    );
                    setUnreadCount((count) => Math.max(0, count - msg.unread));
                  });
                }
              }}
            >
              <div className="message-avatar">
                <img src={creator.image || msg.creatorImage || ""} alt="" />
                {msg.unread > 0 && <i />}
              </div>
              <div>
                <strong>{msg.creatorName || creator.name}</strong>
                <p>{msg.preview}</p>
                <small>{msg.campaign}</small>
              </div>
              <span>{msg.time}</span>
              {msg.unread > 0 && <b>{msg.unread}</b>}
            </button>
          );
        })}
      </div>
      {activeCreator && (
        <section className="brand-chat-screen">
          <StatusBar />
          <header className="brand-chat-head">
            <button onClick={closeChat}>‹</button>
            <div className="brand-chat-person">
              <img src={activeCreator.image} alt={activeCreator.name} />
              <i />
            </div>
            <div>
              <strong>
                {activeCreator.name}
                <span>
                  <Icon name="check" size={8} />
                </span>
              </strong>
              <small>Active now · Collaboration accepted</small>
            </div>
            <button
              onClick={() =>
                onOpen?.({ name: "profile-section", role: "brand", title: "Search conversation" })
              }
              aria-label="Search conversation"
            >
              <Icon name="search" size={16} />
            </button>
            <button
              onClick={() =>
                onOpen?.({ name: "profile-section", role: "brand", title: "Safety & reporting" })
              }
              aria-label="Safety and reporting"
            >
              <Icon name="shield" size={16} />
            </button>
          </header>

          <div className="brand-chat-body">
            {contextOpen && (
              <aside className="chat-campaign-context">
                <span className="chat-context-mark">TL</span>
                <div>
                  <small>ACTIVE COLLABORATION</small>
                  <strong>Summer Edit 2025</strong>
                  <p>1 Reel + 2 Stories · {activeCreator.price}</p>
                </div>
                <button onClick={() => setContextOpen(false)}>
                  <Icon name="close" size={13} />
                </button>
              </aside>
            )}

            <div className="chat-date-divider">
              <span>Today</span>
            </div>
            <div className="chat-safety-note">
              <Icon name="shield" size={13} />
              <p>
                This chat opened after the collaboration was accepted. Keep payments and project
                details on-platform.
              </p>
            </div>

            <div className="chat-message incoming">
              <img src={activeCreator.image} alt="" />
              <div>
                <p>Hi! Thanks for reaching out. I’d love to work on the Summer Edit campaign.</p>
                <small>10:24 AM</small>
              </div>
            </div>
            <div className="chat-message outgoing">
              <div>
                <p>
                  Great to have you, {activeCreator.name.split(" ")[0]}. I’m sharing the creative
                  direction and first review date here.
                </p>
                <small>
                  10:26 AM <Icon name="check" size={9} />
                </small>
              </div>
            </div>

            <div className="chat-brief-card">
              <div className="chat-brief-preview">
                <span>THE LOOM</span>
                <strong>
                  SUMMER
                  <br />
                  EDIT
                </strong>
              </div>
              <div>
                <small>CAMPAIGN BRIEF · PDF</small>
                <strong>Summer Edit — Creator Brief</strong>
                <p>4.8 MB · Shared by you</p>
              </div>
              <button
                onClick={() => onOpen?.({ name: "brief-preview", role: "brand" })}
                aria-label="Open campaign brief"
              >
                <Icon name="arrow" size={14} />
              </button>
            </div>

            <div className="chat-message incoming">
              <img src={activeCreator.image} alt="" />
              <div>
                <p>
                  I’ve reviewed the brief. The natural-light direction fits my content perfectly.
                </p>
                <small>10:31 AM</small>
              </div>
            </div>

            <div className="chat-quick-actions">
              <button onClick={() => setMessage("Can you share your first concept by Friday?")}>
                Set a deadline
              </button>
              <button onClick={() => setMessage("Would you like us to ship the products?")}>
                Discuss products
              </button>
            </div>

            {threadLines.map((line) =>
              line.mine ? (
                <div className="chat-message outgoing" key={line.id}>
                  <div>
                    <p>{line.text}</p>
                    <small>
                      {new Date(line.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      <Icon name="check" size={9} />
                    </small>
                  </div>
                </div>
              ) : (
                <div className="chat-message incoming" key={line.id}>
                  <img src={activeCreator.image} alt="" />
                  <div>
                    <p>{line.text}</p>
                    <small>
                      {new Date(line.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </div>
              ),
            )}
          </div>

          <footer className="brand-chat-composer">
            <button
              aria-label="Add attachment"
              onClick={() =>
                onOpen?.({ name: "profile-section", role: "brand", title: "Add attachment" })
              }
            >
              <Icon name="plus" size={18} />
            </button>
            <div>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder={`Message ${activeCreator.name.split(" ")[0]}…`}
              />
              <button
                aria-label="Add media"
                onClick={() =>
                  onOpen?.({ name: "profile-section", role: "brand", title: "Add media" })
                }
              >
                <Icon name="camera" size={16} />
              </button>
            </div>
            <button
              className={message.trim() ? "ready" : ""}
              aria-label="Send message"
              onClick={sendMessage}
            >
              <Icon name="arrow" size={16} />
            </button>
          </footer>
        </section>
      )}
    </div>
  );
}
