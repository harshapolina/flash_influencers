import { useState } from "react";
import { campaigns, creators } from "../../data";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { AppFlow } from "../../types";

export function CreatorOpportunitiesScreen({
  onOpen,
  applicationSubmitted = false,
}: {
  onOpen?: (flow: AppFlow) => void;
  applicationSubmitted?: boolean;
}) {
  const [requestStatus, setRequestStatus] = useState<"pending" | "accepted" | "declined">(
    "pending",
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or repeated requests");
  const [reportSent, setReportSent] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("For you");
  const [saved, setSaved] = useState<number[]>([1]);
  const [chatMessage, setChatMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  return (
    <div className="screen creator-opportunities-screen">
      <StatusBar />
      <header className="creator-section-head">
        <div>
          <small>DISCOVER</small>
          <h1>Opportunities</h1>
        </div>
        <button
          className="round-button"
          onClick={() => onOpen?.({ name: "saved-opportunities", role: "creator" })}
          aria-label="Saved opportunities"
        >
          <Icon name="bookmark" size={18} />
        </button>
      </header>
      <div className="mobile-search creator-search">
        <Icon name="search" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search brands or campaigns"
        />
        <button
          onClick={() =>
            onOpen?.({
              name: "profile-section",
              role: "creator",
              title: "Opportunity filters",
            })
          }
          aria-label="Opportunity filters"
        >
          <Icon name="filter" size={17} />
          <i>3</i>
        </button>
      </div>
      <div className="pills creator-pills">
        {["For you", "UGC", "Fashion", "Affiliate", "Nearby"].map((item) => (
          <button
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="creator-ai-match-banner">
        <span>
          <Icon name="sparkles" size={20} />
        </span>
        <div>
          <small>ORBITLY AI</small>
          <strong>18 new matches</strong>
          <p>Based on your audience and content style</p>
        </div>
        <button onClick={() => setCategory("For you")} aria-label="Show AI matches">
          <Icon name="arrow" size={16} />
        </button>
      </section>
      <article className={`creator-incoming-request ${requestStatus}`}>
        <header>
          <span>NEW BRAND REQUEST</span>
          <button onClick={() => setReportOpen(true)}>
            <Icon name="shield" size={13} /> Report brand
          </button>
        </header>
        <div className="incoming-brand-row">
          <div className="incoming-brand-mark">TL</div>
          <div>
            <h3>
              The Loom
              <b>
                <Icon name="check" size={8} />
              </b>
            </h3>
            <p>Summer Edit · Paid collaboration</p>
          </div>
          <strong>₹28K</strong>
        </div>
        <p className="incoming-request-copy">
          The Loom invited you to create 1 Reel and 2 Stories for their new summer collection.
        </p>
        {requestStatus === "pending" && (
          <footer>
            <button className="incoming-decline" onClick={() => setRequestStatus("declined")}>
              Decline
            </button>
            <button className="incoming-accept" onClick={() => setRequestStatus("accepted")}>
              Accept request <Icon name="check" size={13} />
            </button>
          </footer>
        )}
        {requestStatus === "accepted" && (
          <div className="incoming-accepted">
            <span>
              <Icon name="check" size={14} />
            </span>
            <div>
              <strong>Request accepted</strong>
              <small>Chat access is now available to you and the brand.</small>
            </div>
            <button onClick={() => setChatOpen(true)}>
              <Icon name="message" size={14} /> Chat
            </button>
          </div>
        )}
        {requestStatus === "declined" && (
          <div className="incoming-declined">
            Request declined
            <button onClick={() => setRequestStatus("pending")}>Undo</button>
          </div>
        )}
      </article>
      <div className="creator-results-line">
        <strong>{applicationSubmitted ? "Application sent · Best matches" : "Best matches"}</strong>
        <button
          onClick={() =>
            onOpen?.({ name: "profile-section", role: "creator", title: "Sort opportunities" })
          }
        >
          Recommended <Icon name="chevron" size={12} />
        </button>
      </div>
      <div className="opportunity-feed">
        {(campaigns as Array<Record<string, any>>)
          .concat([
            {
              title: "Glow From Within",
              brand: "Plum",
              pay: "₹32K",
              type: "1 Reel + 2 Stories",
              color: "#ffd8df",
              icon: "P",
            },
          ])
          .filter((campaign) =>
            `${campaign.brand} ${campaign.title} ${campaign.type}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((campaign, index) => (
            <article key={`${campaign.title}-${index}`}>
              <div className={`campaign-art ca-${index}`}>
                <span className="campaign-brand-mark">{campaign.icon}</span>
                <span className="feed-match">
                  <Icon name="sparkles" size={10} />
                  {95 - index * 2}%
                </span>
                <button
                  className={saved.includes(index) ? "saved" : ""}
                  onClick={() =>
                    setSaved((items) =>
                      items.includes(index)
                        ? items.filter((item) => item !== index)
                        : [...items, index],
                    )
                  }
                  aria-label={
                    saved.includes(index) ? "Remove saved opportunity" : "Save opportunity"
                  }
                >
                  <Icon name="bookmark" size={16} />
                </button>
                <div className="campaign-shape s-one" />
                <div className="campaign-shape s-two" />
                <strong>{campaign.brand}</strong>
              </div>
              <div className="campaign-feed-copy">
                <span>{campaign.brand} · VERIFIED</span>
                <h3>{campaign.title}</h3>
                <p>
                  <Icon name="camera" size={12} />
                  {campaign.type}
                  <i />
                  <Icon name="calendar" size={12} />
                  Apply by 26 Jun
                </p>
                <div className="campaign-tags">
                  <b>Paid</b>
                  <b>Usage: 3 months</b>
                  <b>Remote</b>
                </div>
                <footer>
                  <div>
                    <small>CREATOR PAY</small>
                    <strong>{campaign.pay}</strong>
                  </div>
                  <button
                    onClick={() =>
                      onOpen?.({
                        name: "opportunity",
                        role: "creator",
                        title: campaign.title,
                        context: campaign.brand,
                      })
                    }
                  >
                    View brief <Icon name="arrow" size={14} />
                  </button>
                </footer>
              </div>
            </article>
          ))}
      </div>
      {reportOpen && (
        <div className="report-brand-layer" onClick={() => setReportOpen(false)}>
          <section className="report-brand-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            {!reportSent ? (
              <>
                <header>
                  <span>
                    <Icon name="shield" size={18} />
                  </span>
                  <div>
                    <small>SAFETY & TRUST</small>
                    <h2>Report The Loom</h2>
                    <p>The brand won’t be notified that you submitted a report.</p>
                  </div>
                  <button onClick={() => setReportOpen(false)}>
                    <Icon name="close" size={16} />
                  </button>
                </header>
                <div className="report-reasons">
                  {[
                    "Spam or repeated requests",
                    "Fake brand or identity",
                    "Inappropriate content or behavior",
                    "Scam or suspicious payment request",
                    "Something else",
                  ].map((reason) => (
                    <button
                      className={reportReason === reason ? "active" : ""}
                      key={reason}
                      onClick={() => setReportReason(reason)}
                    >
                      <i />
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea placeholder="Add details (optional)" />
                <button className="submit-brand-report" onClick={() => setReportSent(true)}>
                  Submit report
                </button>
              </>
            ) : (
              <div className="report-sent-state">
                <span>
                  <Icon name="check" size={23} />
                </span>
                <small>REPORT RECEIVED</small>
                <h2>Thank you for letting us know.</h2>
                <p>Our safety team will review this brand and take action if needed.</p>
                <button
                  onClick={() => {
                    setReportOpen(false);
                    setReportSent(false);
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {chatOpen && (
        <div className="creator-chat-layer">
          <section className="creator-chat-sheet">
            <header>
              <button onClick={() => setChatOpen(false)}>‹</button>
              <div className="incoming-brand-mark">TL</div>
              <div>
                <strong>The Loom</strong>
                <small>
                  <i /> Collaboration accepted
                </small>
              </div>
              <button
                onClick={() =>
                  onOpen?.({ name: "profile-section", role: "creator", title: "Safety & reporting" })
                }
                aria-label="Chat safety"
              >
                <Icon name="shield" size={16} />
              </button>
            </header>
            <div className="creator-chat-body">
              <small>TODAY</small>
              <p>Hi Aarohi, thank you for accepting our Summer Edit collaboration.</p>
              <p>We’d love to align on the first content concept when you’re ready.</p>
              {sentMessages.map((sentMessage, index) => (
                <p className="creator-sent-message" key={`${sentMessage}-${index}`}>
                  {sentMessage}
                </p>
              ))}
            </div>
            <footer>
              <button
                onClick={() =>
                  onOpen?.({ name: "profile-section", role: "creator", title: "Add attachment" })
                }
                aria-label="Add attachment"
              >
                <Icon name="plus" size={17} />
              </button>
              <input
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && chatMessage.trim()) {
                    setSentMessages((items) => [...items, chatMessage.trim()]);
                    setChatMessage("");
                  }
                }}
                placeholder="Message The Loom…"
              />
              <button
                onClick={() => {
                  if (!chatMessage.trim()) return;
                  setSentMessages((items) => [...items, chatMessage.trim()]);
                  setChatMessage("");
                }}
                aria-label="Send message"
              >
                <Icon name="arrow" size={16} />
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
