import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { ChatLine } from "../../types";

export function CreatorChat({
  threadId,
  onBack,
}: {
  threadId: string;
  onBack: () => void;
}) {
  const [peerName, setPeerName] = useState("Brand");
  const [campaign, setCampaign] = useState("");
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const data = await api.getThread(threadId);
    setPeerName(data.peer.name);
    setCampaign(data.campaign);
    setMessages(data.messages || []);
  };

  useEffect(() => {
    let alive = true;
    load()
      .catch(() => {
        if (alive) setError("Could not open this chat.");
      });
    const timer = setInterval(() => {
      load().catch(() => {});
    }, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setError("");
    try {
      const { message } = await api.sendThreadMessage(threadId, value);
      setMessages((prev) => [...prev, message]);
      setText("");
    } catch {
      setError("Message failed to send. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen creator-overlay-screen creator-chat-screen">
      <StatusBar />
      <header className="creator-overlay-head">
        <button className="round-button" type="button" onClick={onBack}>
          <Icon name="chevron" size={18} />
        </button>
        <div>
          <small>{campaign || "CAMPAIGN CHAT"}</small>
          <h1>{peerName}</h1>
        </div>
        <span className="round-button chat-peer-mark">{peerName.slice(0, 1)}</span>
      </header>

      <div className="creator-chat-thread">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.mine ? "mine" : "theirs"}`}>
            <p>{msg.text}</p>
            <small>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </div>
        ))}
        {!messages.length && !error && (
          <div className="empty" style={{ paddingTop: 48 }}>
            <h3>Start the conversation</h3>
            <p>Align on brief, drafts, and posting dates here.</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="flow-error chat-error">{error}</p>}

      <form
        className="creator-chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${peerName.split(" ")[0]}…`}
        />
        <button type="submit" disabled={busy || !text.trim()}>
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </div>
  );
}
