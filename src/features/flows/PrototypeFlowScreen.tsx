import { useState } from "react";
import { campaigns, creators } from "../../data";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { AppFlow, FlowName, IconName, OnboardingRole } from "../../types";

export function PrototypeFlowScreen({
  flow,
  onClose,
  balance,
  applicationSubmitted,
  campaignPublished,
  paymentComplete,
  notificationsRead,
  onMarkNotificationsRead,
  onApply,
  onPublishCampaign,
  onCompletePayment,
  onWithdraw,
}: {
  flow: AppFlow;
  onClose: () => void;
  balance: number;
  applicationSubmitted: boolean;
  campaignPublished: boolean;
  paymentComplete: boolean;
  notificationsRead: boolean;
  onMarkNotificationsRead: () => void;
  onApply: () => void;
  onPublishCampaign: (payload?: { title: string; deliverables?: string }) => void;
  onCompletePayment: () => void;
  onWithdraw: (amount: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [amount, setAmount] = useState("20000");
  const [campaignName, setCampaignName] = useState("");
  const [note, setNote] = useState("");
  const [aiMessage, setAiMessage] = useState(flow.context ?? "");
  const [aiReply, setAiReply] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [approved, setApproved] = useState(false);
  const toggleSelected = (item: string) =>
    setSelected((items) =>
      items.includes(item) ? items.filter((current) => current !== item) : [...items, item],
    );

  const titles: Record<FlowName, string> = {
    notifications: "Notifications",
    "saved-creators": "Saved creators",
    "saved-opportunities": "Saved opportunities",
    "campaign-create": "Create campaign",
    "brand-campaign": flow.title ?? "Summer Edit 2025",
    "creator-campaign": flow.title ?? "Summer Edit 2025",
    submissions: "Review submissions",
    applications: "Creator applications",
    payment: "Creator payment",
    "brand-analytics": flow.title ?? "Campaign performance",
    "creator-analytics": "Creator analytics",
    invite: "Invite creators",
    "ai-assistant": "Orbitly AI",
    opportunity: flow.title ?? "Campaign brief",
    withdraw: "Withdraw earnings",
    transactions: "Transactions",
    "brief-preview": "Campaign brief",
    "profile-section": flow.title ?? "Settings",
  };
  const kicker = flow.role === "creator" ? "CREATOR WORKSPACE" : "BRAND WORKSPACE";

  const finish = (callback?: () => void) => {
    callback?.();
    setComplete(true);
  };

  return (
    <div className="prototype-flow-layer" role="dialog" aria-modal="true">
      <section className="prototype-flow-screen">
        <StatusBar />
        <header className="flow-header">
          <button onClick={onClose} aria-label="Go back">
            ‹
          </button>
          <div>
            <small>{kicker}</small>
            <strong>{titles[flow.name]}</strong>
          </div>
          <span />
        </header>

        <div className="flow-scroll">
          {flow.name === "notifications" && (
            <>
              <div className="flow-heading split">
                <div>
                  <span>ACTIVITY</span>
                  <h1>Stay in the loop.</h1>
                </div>
                <button onClick={onMarkNotificationsRead}>Mark all read</button>
              </div>
              <div className="flow-segment">
                <button
                  className={selected.includes("Unread only") ? "" : "active"}
                  onClick={() => setSelected([])}
                >
                  All
                </button>
                <button
                  className={selected.includes("Unread only") ? "active" : ""}
                  onClick={() => setSelected(["Unread only"])}
                >
                  Unread
                </button>
              </div>
              <div className="notification-feed">
                {[
                  [
                    "check",
                    flow.role === "creator"
                      ? "The Loom accepted your concept"
                      : "Aarohi accepted your invitation",
                    "Summer Edit 2025 · 12 minutes ago",
                  ],
                  [
                    "camera",
                    flow.role === "creator"
                      ? "Your reel is ready for review"
                      : "Rhea uploaded a revised reel",
                    "Monsoon Stories · 1 hour ago",
                  ],
                  [
                    "wallet",
                    flow.role === "creator" ? "₹18,000 payment received" : "Payment due tomorrow",
                    "Everyday Active · Yesterday",
                  ],
                  ["shield", "Your profile remains verified", "Account trust · 3 days ago"],
                ].map(([icon, title, detail], index) => (
                  <button
                    className={notificationsRead ? "" : index < 2 ? "unread" : ""}
                    onClick={() => setComplete(true)}
                    key={title}
                  >
                    <span>
                      <Icon name={icon as IconName} size={16} />
                    </span>
                    <p>
                      <strong>{title}</strong>
                      <small>{detail}</small>
                    </p>
                    <Icon name="chevron" size={13} />
                  </button>
                ))}
              </div>
              {complete && <div className="flow-toast">Notification opened</div>}
            </>
          )}

          {(flow.name === "saved-creators" || flow.name === "saved-opportunities") && (
            <>
              <div className="flow-heading">
                <span>SAVED FOR LATER</span>
                <h1>{flow.name === "saved-creators" ? "Creators you love." : "Your shortlist."}</h1>
                <p>Everything you saved is ready when you are.</p>
              </div>
              <div className="saved-flow-grid">
                {flow.name === "saved-creators"
                  ? creators.slice(0, 3).map((creator) => (
                      <article key={creator.id}>
                        <img src={creator.image} alt={creator.name} />
                        <span>{creator.match}% FIT</span>
                        <h3>{creator.name}</h3>
                        <p>{creator.niche}</p>
                        <button onClick={() => setComplete(true)}>Invite creator</button>
                      </article>
                    ))
                  : campaigns.map((campaign, index) => (
                      <article className={`saved-opportunity so-${index}`} key={campaign.title}>
                        <div className="saved-brand-mark">{campaign.icon}</div>
                        <span>{96 - index * 3}% MATCH</span>
                        <h3>{campaign.title}</h3>
                        <p>
                          {campaign.brand} · {campaign.pay}
                        </p>
                        <button onClick={() => setStep(index + 1)}>View brief</button>
                      </article>
                    ))}
              </div>
              {complete && <div className="flow-toast">Invitation ready to send</div>}
            </>
          )}

          {flow.name === "campaign-create" && !complete && (
            <>
              <div className="flow-progress">
                <i style={{ width: `${((step + 1) / 5) * 100}%` }} />
              </div>
              <div className="flow-heading">
                <span>STEP {step + 1} OF 5</span>
                <h1>
                  {
                    [
                      "Start with the idea.",
                      "Choose deliverables.",
                      "Define the audience.",
                      "Set the terms.",
                      "Review and publish.",
                    ][step]
                  }
                </h1>
              </div>
              <div className="flow-form-card">
                {step === 0 && (
                  <>
                    <label>
                      Campaign name
                      <input
                        value={campaignName}
                        onChange={(event) => setCampaignName(event.target.value)}
                        placeholder="e.g. Monsoon Essentials"
                      />
                    </label>
                    <label>
                      Objective
                      <select defaultValue="Awareness">
                        <option>Awareness</option>
                        <option>Content creation</option>
                        <option>Conversions</option>
                      </select>
                    </label>
                    <label>
                      Campaign summary
                      <textarea placeholder="Tell creators what you want to achieve…" />
                    </label>
                  </>
                )}
                {step === 1 && (
                  <FlowChoices
                    items={[
                      "Instagram Reel",
                      "Stories",
                      "UGC video",
                      "Static post",
                      "Usage rights",
                    ]}
                    selected={selected}
                    onToggle={toggleSelected}
                  />
                )}
                {step === 2 && (
                  <>
                    <FlowChoices
                      items={[
                        "Fashion",
                        "Beauty",
                        "Lifestyle",
                        "Mumbai",
                        "Pan India",
                        "Hindi",
                        "English",
                      ]}
                      selected={selected}
                      onToggle={toggleSelected}
                    />
                    <label>
                      Creator count
                      <input type="number" defaultValue="8" />
                    </label>
                  </>
                )}
                {step === 3 && (
                  <>
                    <label>
                      Total budget
                      <input defaultValue="₹80,000" />
                    </label>
                    <div className="flow-two-fields">
                      <label>
                        Start date
                        <input type="date" defaultValue="2025-06-24" />
                      </label>
                      <label>
                        End date
                        <input type="date" defaultValue="2025-07-18" />
                      </label>
                    </div>
                    <ToggleRow
                      label="Product shipping required"
                      detail="Collect creator addresses securely"
                    />
                  </>
                )}
                {step === 4 && (
                  <div className="flow-review-card">
                    <span>READY TO PUBLISH</span>
                    <h3>{campaignName || "Monsoon Essentials"}</h3>
                    <p>8 creators · Reels and Stories · ₹80,000</p>
                    <div>
                      <strong>Audience</strong>
                      <small>Fashion & Lifestyle · Pan India · Hindi + English</small>
                    </div>
                    <div>
                      <strong>Timeline</strong>
                      <small>24 Jun – 18 Jul</small>
                    </div>
                  </div>
                )}
              </div>
              <footer className="flow-sticky-actions">
                {step > 0 && (
                  <button onClick={() => setStep((current) => current - 1)}>Back</button>
                )}
                <button
                  className="primary"
                  disabled={step === 0 && !campaignName.trim()}
                  onClick={() =>
                    step === 4
                      ? finish(() =>
                          onPublishCampaign({
                            title: campaignName.trim() || "Untitled campaign",
                            deliverables: selected.join(", ") || "Reels and Stories",
                          }),
                        )
                      : setStep((current) => current + 1)
                  }
                >
                  {step === 4 ? "Publish campaign" : "Continue"} <Icon name="arrow" size={14} />
                </button>
              </footer>
            </>
          )}

          {flow.name === "opportunity" && !complete && (
            <>
              <div className="opportunity-flow-hero">
                <span className="saved-brand-mark">
                  {flow.context?.slice(0, 2).toUpperCase() || "NB"}
                </span>
                <small>VERIFIED BRAND · {applicationSubmitted ? "APPLIED" : "96% MATCH"}</small>
                <h1>{flow.title ?? "Monsoon Skin Reset"}</h1>
                <p>{flow.context ?? "Nura Beauty"} · Paid collaboration</p>
              </div>
              {step === 0 ? (
                <>
                  <div className="flow-stat-grid">
                    <div>
                      <strong>₹24K</strong>
                      <span>Creator pay</span>
                    </div>
                    <div>
                      <strong>3</strong>
                      <span>Deliverables</span>
                    </div>
                    <div>
                      <strong>18 Jul</strong>
                      <span>Deadline</span>
                    </div>
                  </div>
                  <div className="flow-detail-stack">
                    <section>
                      <span>CAMPAIGN GOAL</span>
                      <h3>Show real routines, not polished ads.</h3>
                      <p>
                        Create warm, natural-light content introducing the new monsoon skincare set.
                      </p>
                    </section>
                    <section>
                      <span>DELIVERABLES</span>
                      <ul>
                        <li>1 Instagram Reel · 30–45 sec</li>
                        <li>2 story frames with link</li>
                        <li>3 months organic usage rights</li>
                      </ul>
                    </section>
                    <section>
                      <span>CREATOR FIT</span>
                      <p>Beauty or wellness creators in India with an engaged 18–34 audience.</p>
                    </section>
                  </div>
                  <footer className="flow-sticky-actions">
                    <button onClick={() => setComplete(true)}>Save</button>
                    <button
                      className="primary"
                      onClick={() => (applicationSubmitted ? setComplete(true) : setStep(1))}
                    >
                      {applicationSubmitted ? "Application submitted" : "Apply now"}
                    </button>
                  </footer>
                </>
              ) : (
                <>
                  <div className="flow-heading compact">
                    <span>YOUR APPLICATION</span>
                    <h1>Make your pitch personal.</h1>
                  </div>
                  <div className="flow-form-card">
                    <label>
                      Your concept
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Describe your creative approach…"
                      />
                    </label>
                    <label>
                      Proposed quote
                      <input defaultValue="₹24,000" />
                    </label>
                    <label>
                      Availability
                      <select>
                        <option>Available this week</option>
                        <option>Available next week</option>
                      </select>
                    </label>
                    <ToggleRow label="I agree to the usage terms" detail="3 months organic usage" />
                  </div>
                  <footer className="flow-sticky-actions">
                    <button onClick={() => setStep(0)}>Back</button>
                    <button
                      className="primary"
                      disabled={!note.trim()}
                      onClick={() => finish(onApply)}
                    >
                      Submit application
                    </button>
                  </footer>
                </>
              )}
            </>
          )}

          {flow.name === "withdraw" && !complete && (
            <>
              <div className="withdraw-hero">
                <span>AVAILABLE BALANCE</span>
                <strong>₹{balance.toLocaleString("en-IN")}</strong>
                <p>Usually arrives within 1–2 business days.</p>
              </div>
              <div className="flow-progress">
                <i style={{ width: `${((step + 1) / 3) * 100}%` }} />
              </div>
              <div className="flow-form-card">
                {step === 0 && (
                  <>
                    <label>
                      Amount
                      <div className="currency-input">
                        <span>₹</span>
                        <input
                          value={amount}
                          onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
                          inputMode="numeric"
                        />
                      </div>
                      {Number(amount) > balance && (
                        <small className="form-error">
                          Amount exceeds your available balance by ₹
                          {(Number(amount) - balance).toLocaleString("en-IN")}.
                        </small>
                      )}
                      {!Number(amount) && (
                        <small className="form-error">Enter an amount greater than ₹0.</small>
                      )}
                    </label>
                    <FlowChoices
                      items={["₹10,000", "₹20,000", "Withdraw all"]}
                      selected={selected}
                      onToggle={(item) => {
                        setSelected([item]);
                        setAmount(
                          item === "Withdraw all" ? String(balance) : item.replace(/\D/g, ""),
                        );
                      }}
                    />
                  </>
                )}
                {step === 1 && (
                  <div className="payout-method">
                    <span>
                      <Icon name="wallet" size={18} />
                    </span>
                    <p>
                      <strong>HDFC Bank ···· 4821</strong>
                      <small>Primary payout account</small>
                    </p>
                    <Icon name="check" size={16} />
                  </div>
                )}
                {step === 2 && (
                  <div className="flow-review-card">
                    <span>WITHDRAWAL SUMMARY</span>
                    <h3>₹{Number(amount || 0).toLocaleString("en-IN")}</h3>
                    <p>To HDFC Bank ···· 4821</p>
                    <div>
                      <strong>Processing fee</strong>
                      <small>₹0</small>
                    </div>
                    <div>
                      <strong>Expected</strong>
                      <small>Within 2 business days</small>
                    </div>
                  </div>
                )}
              </div>
              <footer className="flow-sticky-actions">
                {step > 0 && (
                  <button onClick={() => setStep((current) => current - 1)}>Back</button>
                )}
                <button
                  className="primary"
                  disabled={!Number(amount) || Number(amount) > balance}
                  onClick={() =>
                    step === 2
                      ? finish(() => onWithdraw(Number(amount)))
                      : setStep((current) => current + 1)
                  }
                >
                  {step === 2 ? "Confirm withdrawal" : "Continue"}
                </button>
              </footer>
            </>
          )}

          {(flow.name === "brand-campaign" || flow.name === "creator-campaign") && (
            <CampaignWorkspaceFlow
              creatorMode={flow.name === "creator-campaign"}
              onAction={() => setComplete(true)}
              actionComplete={complete}
            />
          )}

          {flow.name === "submissions" && (
            <>
              <div className="flow-heading">
                <span>3 NEED REVIEW</span>
                <h1>Content ready for you.</h1>
                <p>Review against the brief and keep feedback specific.</p>
              </div>
              <div className="submission-preview">
                <img src={creators[1].image} alt="Rhea Kapoor submission" />
                <span>
                  <Icon name="camera" size={16} /> FINAL REEL · 00:32
                </span>
              </div>
              <div className="submission-owner">
                <img src={creators[1].image} alt="" />
                <p>
                  <strong>Rhea Kapoor</strong>
                  <small>Summer Edit 2025 · Final reel</small>
                </p>
                <b>V2</b>
              </div>
              <div className="review-checklist">
                {[
                  "Brand visible in first 5 seconds",
                  "Natural-light direction",
                  "Required CTA included",
                ].map((item) => (
                  <button
                    className={selected.includes(item) ? "active" : ""}
                    onClick={() => toggleSelected(item)}
                    key={item}
                  >
                    <i>{selected.includes(item) && <Icon name="check" size={10} />}</i>
                    {item}
                  </button>
                ))}
              </div>
              <textarea className="flow-note" placeholder="Add clear feedback for the creator…" />
              <footer className="flow-sticky-actions">
                <button onClick={() => setComplete(true)}>Request changes</button>
                <button
                  className="primary"
                  onClick={() => {
                    setApproved(true);
                    setComplete(true);
                  }}
                >
                  Approve content
                </button>
              </footer>
              {complete && (
                <div className="flow-toast">
                  {approved ? "Content approved" : "Changes requested"}
                </div>
              )}
            </>
          )}

          {flow.name === "applications" && (
            <>
              <div className="flow-heading">
                <span>8 NEW APPLICATIONS</span>
                <h1>Meet your strongest fit.</h1>
              </div>
              <div className="applicant-hero">
                <img src={creators[0].image} alt={creators[0].name} />
                <div>
                  <span>96% BRAND FIT</span>
                  <h2>{flow.context ?? creators[0].name}</h2>
                  <p>Fashion · Beauty · Mumbai</p>
                </div>
              </div>
              <div className="flow-stat-grid">
                <div>
                  <strong>248K</strong>
                  <span>Followers</span>
                </div>
                <div>
                  <strong>5.8%</strong>
                  <span>Engagement</span>
                </div>
                <div>
                  <strong>₹28K</strong>
                  <span>Quote</span>
                </div>
              </div>
              <div className="flow-detail-stack">
                <section>
                  <span>CREATIVE PROPOSAL</span>
                  <h3>“Colour in the everyday.”</h3>
                  <p>
                    A wardrobe-style reel moving from morning neutrals into The Loom’s saturated
                    summer pieces.
                  </p>
                </section>
                <section>
                  <span>AVAILABILITY</span>
                  <p>Ready to begin this week · first concept in 3 days</p>
                </section>
              </div>
              <footer className="flow-sticky-actions">
                <button onClick={() => setComplete(true)}>Decline</button>
                <button className="primary" onClick={() => setComplete(true)}>
                  Accept creator
                </button>
              </footer>
              {complete && <div className="flow-toast">Application status updated</div>}
            </>
          )}

          {flow.name === "payment" && !complete && (
            <>
              <div className="flow-heading">
                <span>MILESTONE PAYMENT</span>
                <h1>Release creator payment.</h1>
                <p>The approved deliverable has unlocked this payment.</p>
              </div>
              <div className="payment-receipt-card">
                <img src={creators[0].image} alt={creators[0].name} />
                <h3>Aarohi Mehta</h3>
                <p>Summer Edit · Final Reel</p>
                <strong>₹28,000</strong>
                <div>
                  <span>Platform fee</span>
                  <b>₹2,240</b>
                </div>
                <div>
                  <span>Total</span>
                  <b>₹30,240</b>
                </div>
              </div>
              <div className="payout-method">
                <span>
                  <Icon name="wallet" size={18} />
                </span>
                <p>
                  <strong>Business card ···· 9024</strong>
                  <small>Visa · The Loom</small>
                </p>
                <Icon name="check" size={16} />
              </div>
              <footer className="flow-sticky-actions">
                <button onClick={onClose}>Cancel</button>
                <button className="primary" onClick={() => finish(onCompletePayment)}>
                  Pay securely
                </button>
              </footer>
            </>
          )}

          {(flow.name === "brand-analytics" || flow.name === "creator-analytics") && (
            <AnalyticsFlow creatorMode={flow.name === "creator-analytics"} />
          )}

          {flow.name === "invite" && (
            <>
              <div className="flow-heading">
                <span>DIRECT INVITE</span>
                <h1>Bring the right voices in.</h1>
                <p>Select creators and attach a campaign invitation.</p>
              </div>
              <div className="invite-list">
                {creators.map((creator) => (
                  <button
                    className={selected.includes(creator.name) ? "active" : ""}
                    onClick={() => toggleSelected(creator.name)}
                    key={creator.id}
                  >
                    <img src={creator.image} alt={creator.name} />
                    <p>
                      <strong>{creator.name}</strong>
                      <small>
                        {creator.niche} · {creator.match}% fit
                      </small>
                    </p>
                    <i>{selected.includes(creator.name) && <Icon name="check" size={10} />}</i>
                  </button>
                ))}
              </div>
              <label className="flow-standalone-label">
                Campaign
                <select>
                  <option>Summer Edit 2025</option>
                  <option>Monsoon Stories</option>
                </select>
              </label>
              <footer className="flow-sticky-actions">
                <button
                  className="primary"
                  disabled={!selected.length}
                  onClick={() => setComplete(true)}
                >
                  Send {selected.length || ""} invitation{selected.length === 1 ? "" : "s"}
                </button>
              </footer>
              {complete && <div className="flow-toast">Invitations sent</div>}
            </>
          )}

          {flow.name === "ai-assistant" && (
            <>
              <div className="ai-flow-hero">
                <span>
                  <Icon name="sparkles" size={26} />
                </span>
                <small>ORBITLY AI</small>
                <h1>Turn a goal into a clear next step.</h1>
              </div>
              <div className="ai-suggestions">
                {[
                  "Find Telugu lifestyle creators",
                  "Plan a ₹50K launch",
                  "Analyze Summer Edit",
                ].map((item) => (
                  <button onClick={() => setAiMessage(item)} key={item}>
                    {item}
                  </button>
                ))}
              </div>
              {aiReply && (
                <div className="ai-reply">
                  <span>
                    <Icon name="sparkles" size={14} />
                  </span>
                  <div>
                    <small>ORBITLY RECOMMENDATION</small>
                    <p>{aiReply}</p>
                    <button onClick={() => setComplete(true)}>Use this plan</button>
                  </div>
                </div>
              )}
              <div className="ai-composer">
                <input
                  value={aiMessage}
                  onChange={(event) => setAiMessage(event.target.value)}
                  placeholder="Ask about creators or campaign growth…"
                />
                <button
                  onClick={() => {
                    if (!aiMessage.trim()) return;
                    setAiReply(
                      "Start with 6 micro-creators in Mumbai and Hyderabad, reserve 20% of budget for usage rights, and test two creative directions before scaling.",
                    );
                  }}
                  aria-label="Send prompt"
                >
                  <Icon name="arrow" size={16} />
                </button>
              </div>
              {complete && <div className="flow-toast">Plan added to your campaign notes</div>}
            </>
          )}

          {flow.name === "transactions" && (
            <>
              <div className="flow-heading">
                <span>PAYMENT HISTORY</span>
                <h1>Every rupee, accounted for.</h1>
              </div>
              <div className="flow-segment">
                {["All", "Paid", "Pending"].map((item) => (
                  <button
                    className={
                      selected[0] === item || (!selected.length && item === "All") ? "active" : ""
                    }
                    onClick={() => setSelected([item])}
                    key={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="transaction-flow-list">
                {[
                  ["The Loom", "Summer Edit milestone", "+₹18,000", "Paid"],
                  ["Nura Beauty", "Monsoon campaign", "+₹24,000", "Processing"],
                  ["Orbitly", "Platform fee", "−₹1,920", "Fee"],
                  ["Flex Society", "Everyday Active", "+₹16,000", "Paid"],
                ].map(([name, detail, value, status]) => (
                  <button onClick={() => setComplete(true)} key={detail}>
                    <span>
                      <Icon name={status === "Fee" ? "wallet" : "briefcase"} size={15} />
                    </span>
                    <p>
                      <strong>{name}</strong>
                      <small>{detail} · 18 Jun</small>
                    </p>
                    <div>
                      <strong>{value}</strong>
                      <small>{status}</small>
                    </div>
                  </button>
                ))}
              </div>
              {complete && <div className="flow-toast">Receipt opened</div>}
            </>
          )}

          {flow.name === "brief-preview" && (
            <>
              <div className="brief-cover">
                <small>THE LOOM</small>
                <strong>
                  SUMMER
                  <br />
                  EDIT
                </strong>
                <span>CREATOR BRIEF · 2025</span>
              </div>
              <div className="flow-detail-stack">
                <section>
                  <span>CAMPAIGN IDEA</span>
                  <h3>Colour made for every day.</h3>
                  <p>Show The Loom as part of an expressive, real Indian summer wardrobe.</p>
                </section>
                <section>
                  <span>CONTENT DIRECTION</span>
                  <ul>
                    <li>Natural daylight and lived-in spaces</li>
                    <li>Product visible in the first 5 seconds</li>
                    <li>Warm, personal voiceover</li>
                  </ul>
                </section>
                <section>
                  <span>KEY DATES</span>
                  <p>
                    Concept · 22 Jun
                    <br />
                    Draft · 26 Jun
                    <br />
                    Publish · 30 Jun
                  </p>
                </section>
              </div>
              <button className="flow-download" onClick={() => setComplete(true)}>
                <Icon name="arrow" size={14} /> Prepare PDF copy
              </button>
              {complete && <div className="flow-toast">Brief prepared</div>}
            </>
          )}

          {flow.name === "profile-section" && (
            <ProfileSectionFlow
              title={flow.title ?? "Settings"}
              role={flow.role ?? "brand"}
              context={flow.context}
              onSaved={() => setComplete(true)}
            />
          )}
          {flow.name === "profile-section" && complete && (
            <div className="flow-toast">Changes saved</div>
          )}

          {complete &&
            ["campaign-create", "opportunity", "withdraw", "payment"].includes(flow.name) && (
              <div className="flow-success-state">
                <span>
                  <Icon name="check" size={24} />
                </span>
                <small>ALL SET</small>
                <h1>
                  {flow.name === "campaign-create"
                    ? "Your campaign is live."
                    : flow.name === "opportunity"
                      ? applicationSubmitted
                        ? "Application submitted."
                        : "Opportunity saved."
                      : flow.name === "withdraw"
                        ? "Withdrawal is processing."
                        : "Payment complete."}
                </h1>
                <p>
                  {flow.name === "withdraw"
                    ? "We’ll notify you when the money reaches your bank."
                    : "This update is now reflected across your Orbitly workspace."}
                </p>
                <button onClick={onClose}>Done</button>
              </div>
            )}
          {paymentComplete && flow.name === "payment" && !complete && (
            <div className="flow-toast">This payment was already completed</div>
          )}
          {campaignPublished && flow.name === "campaign-create" && step === 0 && !complete && (
            <div className="flow-toast">Your previous campaign is live</div>
          )}
        </div>
      </section>
    </div>
  );
}

export function FlowChoices({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="flow-choice-grid">
      {items.map((item) => (
        <button
          className={selected.includes(item) ? "active" : ""}
          onClick={() => onToggle(item)}
          key={item}
        >
          <i>{selected.includes(item) && <Icon name="check" size={9} />}</i>
          {item}
        </button>
      ))}
    </div>
  );
}

export function ToggleRow({ label, detail }: { label: string; detail: string }) {
  const [enabled, setEnabled] = useState(true);
  return (
    <button className="flow-toggle-row" onClick={() => setEnabled((current) => !current)}>
      <p>
        <strong>{label}</strong>
        <small>{detail}</small>
      </p>
      <i className={enabled ? "on" : ""}>
        <b />
      </i>
    </button>
  );
}

export function CampaignWorkspaceFlow({
  creatorMode,
  onAction,
  actionComplete,
}: {
  creatorMode: boolean;
  onAction: (name: string) => void;
  actionComplete: boolean;
}) {
  const [tab, setTab] = useState("Overview");
  return (
    <>
      <div className="campaign-workspace-hero">
        <span>ACTIVE CAMPAIGN</span>
        <h1>Summer Edit 2025</h1>
        <p>The Loom · Due 28 June</p>
        <div>
          <i>
            <b />
          </i>
          <strong>72%</strong>
        </div>
      </div>
      <div className="flow-segment workspace-tabs">
        {["Overview", "Milestones", creatorMode ? "Payment" : "Creators"].map((item) => (
          <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Overview" && (
        <>
          <div className="flow-stat-grid">
            <div>
              <strong>{creatorMode ? "3/4" : "6/8"}</strong>
              <span>{creatorMode ? "Milestones" : "Creators"}</span>
            </div>
            <div>
              <strong>12</strong>
              <span>Deliverables</span>
            </div>
            <div>
              <strong>{creatorMode ? "₹28K" : "₹2.1L"}</strong>
              <span>{creatorMode ? "Your pay" : "Spent"}</span>
            </div>
          </div>
          <div className="flow-detail-stack">
            <section>
              <span>NEXT ACTION</span>
              <h3>{creatorMode ? "Submit your final reel" : "Review 3 creator submissions"}</h3>
              <p>Due tomorrow · The brief checklist is attached.</p>
              <button onClick={() => onAction(creatorMode ? "submitted" : "review")}>
                {creatorMode ? "Submit deliverable" : "Start review"}{" "}
                <Icon name="arrow" size={13} />
              </button>
            </section>
            <section>
              <span>CAMPAIGN BRIEF</span>
              <p>1 Reel + 2 Stories · Natural-light fashion direction · 3 months usage.</p>
            </section>
          </div>
        </>
      )}
      {tab === "Milestones" && (
        <div className="milestone-list">
          {[
            ["Brief accepted", "18 Jun", true],
            ["Concept approved", "21 Jun", true],
            ["Draft submitted", "25 Jun", true],
            [
              actionComplete ? "Final reel in review" : "Submit final reel",
              "28 Jun",
              actionComplete,
            ],
          ].map(([title, date, done], index) => (
            <div className={done ? "done" : index === 3 ? "current" : ""} key={String(title)}>
              <i>{done ? <Icon name="check" size={10} /> : index + 1}</i>
              <p>
                <strong>{title}</strong>
                <small>{date}</small>
              </p>
            </div>
          ))}
        </div>
      )}
      {tab === "Creators" && !creatorMode && (
        <div className="invite-list">
          {creators.map((creator, index) => (
            <button onClick={() => setTab("Overview")} key={creator.id}>
              <img src={creator.image} alt={creator.name} />
              <p>
                <strong>{creator.name}</strong>
                <small>{["Submitted", "Creating", "Awaiting brief", "Approved"][index]}</small>
              </p>
              <Icon name="chevron" size={13} />
            </button>
          ))}
        </div>
      )}
      {tab === "Payment" && creatorMode && (
        <div className="payment-receipt-card compact">
          <span>NEXT MILESTONE</span>
          <h3>Final content approval</h3>
          <strong>₹18,000</strong>
          <p>Unlocks when The Loom approves your final reel.</p>
        </div>
      )}
      {actionComplete && (
        <div className="flow-toast">
          {creatorMode ? "Deliverable submitted for review" : "Review queue opened"}
        </div>
      )}
    </>
  );
}

export function AnalyticsFlow({ creatorMode }: { creatorMode: boolean }) {
  const [period, setPeriod] = useState("30 days");
  const [reportReady, setReportReady] = useState(false);
  const values = creatorMode
    ? [
        ["1.84M", "Reach"],
        ["6.8%", "Engagement"],
        ["248K", "Followers"],
        ["₹48K", "Earnings"],
      ]
    : [
        ["8.42M", "Reach"],
        ["412K", "Engagement"],
        ["28.4K", "Clicks"],
        ["1,842", "Conversions"],
      ];
  return (
    <>
      <div className="flow-heading split">
        <div>
          <span>PERFORMANCE</span>
          <h1>{creatorMode ? "Your content is growing." : "See what moved people."}</h1>
        </div>
        <button
          onClick={() => setPeriod((current) => (current === "30 days" ? "90 days" : "30 days"))}
        >
          {period}
        </button>
      </div>
      <div className="analytics-kpis">
        {values.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>↑ {label === "Clicks" ? "8" : "18"}%</small>
          </div>
        ))}
      </div>
      <section className="analytics-main-chart">
        <header>
          <div>
            <small>TOTAL {creatorMode ? "REACH" : "CAMPAIGN REACH"}</small>
            <strong>{creatorMode ? "1.84M" : "8.42M"}</strong>
          </div>
          <span>
            <Icon name="trending" size={12} /> 18.6%
          </span>
        </header>
        <div>
          {[32, 47, 39, 66, 54, 78, 69, 94, 81, 100].map((height, index) => (
            <i style={{ height: `${height}%` }} key={index} />
          ))}
        </div>
        <footer>
          <span>May 20</span>
          <span>Jun 18</span>
        </footer>
      </section>
      <div className="flow-detail-stack">
        <section>
          <span>TOP PERFORMER</span>
          <div className="analytics-top-row">
            <img src={creators[0].image} alt="" />
            <p>
              <strong>{creatorMode ? "Summer colour transition" : "Aarohi Mehta"}</strong>
              <small>
                {creatorMode ? "624K views · 8.2% engagement" : "2.1M reach · 6.9% engagement"}
              </small>
            </p>
            <b>1</b>
          </div>
        </section>
        <section>
          <span>{creatorMode ? "AUDIENCE" : "CHANNEL BREAKDOWN"}</span>
          <div className="analytics-bars">
            {[
              ["Instagram", 78],
              ["YouTube", 52],
              [creatorMode ? "Women 18–34" : "Affiliate", 38],
            ].map(([label, value]) => (
              <div key={label}>
                <p>
                  <strong>{label}</strong>
                  <span>{value}%</span>
                </p>
                <i>
                  <b style={{ width: `${value}%` }} />
                </i>
              </div>
            ))}
          </div>
        </section>
      </div>
      <button className="flow-download" onClick={() => setReportReady(true)}>
        <Icon name="arrow" size={14} /> Prepare report
      </button>
      {reportReady && <div className="flow-toast">Report prepared</div>}
    </>
  );
}

export function ProfileSectionFlow({
  title,
  role,
  context,
  onSaved,
}: {
  title: string;
  role: OnboardingRole;
  context?: string;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState("All activity");
  const isCreator = role === "creator";
  const lowerTitle = title.toLowerCase();
  const pageIcon: IconName =
    lowerTitle.includes("security") || lowerTitle.includes("verification")
      ? "shield"
      : lowerTitle.includes("payment") ||
          lowerTitle.includes("billing") ||
          lowerTitle.includes("pricing") ||
          lowerTitle.includes("receipt")
        ? "wallet"
        : lowerTitle.includes("notification")
          ? "bell"
          : lowerTitle.includes("social") ||
              lowerTitle.includes("connected") ||
              lowerTitle.includes("integration")
            ? "link"
            : lowerTitle.includes("portfolio") || lowerTitle.includes("media")
              ? "camera"
              : lowerTitle.includes("availability") ||
                  lowerTitle.includes("calendar") ||
                  lowerTitle.includes("date")
                ? "calendar"
                : lowerTitle.includes("support") || lowerTitle.includes("safety")
                  ? "message"
                  : lowerTitle.includes("appearance") || lowerTitle.includes("subscription")
                    ? "sparkles"
                    : lowerTitle.includes("language") || lowerTitle.includes("location")
                      ? "pin"
                      : "user";
  const pageDescription = lowerTitle.includes("security")
    ? "Protect your account and control where you’re signed in."
    : lowerTitle.includes("notification")
      ? "Choose the updates you want to receive from Orbitly."
      : lowerTitle.includes("privacy") || lowerTitle.includes("settings")
        ? "Control discovery, messages, and account visibility."
        : lowerTitle.includes("pricing")
          ? "Set clear starting rates brands can understand."
          : lowerTitle.includes("availability")
            ? "Let brands know when you are ready for new work."
            : lowerTitle.includes("portfolio")
              ? "Keep your strongest work visible and up to date."
              : lowerTitle.includes("social") || lowerTitle.includes("connected")
                ? "Manage the accounts and services connected to Orbitly."
                : lowerTitle.includes("language")
                  ? "Set your language, currency, region, and time zone."
                  : lowerTitle.includes("appearance")
                    ? "Choose how Orbitly looks and moves on this device."
                    : lowerTitle.includes("support")
                      ? "Find answers or send a message to the Orbitly team."
                      : lowerTitle.includes("team")
                        ? "Manage access and responsibilities for your workspace."
                        : lowerTitle.includes("subscription")
                          ? "Review your current plan, limits, and included tools."
                          : lowerTitle.includes("about")
                            ? "Product information, policies, and app details."
                            : "Review and update the information shown across Orbitly.";
  const simpleChoice =
    lowerTitle.includes("filter") ||
    lowerTitle.includes("sort") ||
    lowerTitle.includes("date") ||
    lowerTitle.includes("calendar") ||
    lowerTitle.includes("attachment") ||
    lowerTitle.includes("media") ||
    lowerTitle.includes("quick");
  return (
    <div className={`settings-detail-page ${isCreator ? "creator-settings" : "brand-settings"}`}>
      <div className="settings-detail-hero">
        <span className="settings-detail-icon">
          <Icon name={pageIcon} size={21} />
        </span>
        <div>
          <small>{isCreator ? "CREATOR ACCOUNT" : "BUSINESS ACCOUNT"}</small>
          <h1>{title}</h1>
          <p>{context ?? pageDescription}</p>
        </div>
      </div>
      {lowerTitle.includes("public profile") && (
        <div className="public-profile-preview">
          <img src={creators[0].image} alt={creators[0].name} />
          <span>VERIFIED CREATOR</span>
          <h2>Aarohi Mehta</h2>
          <p>Fashion, beauty and everyday colour from Mumbai.</p>
          <div>
            <strong>
              248K<small>Followers</small>
            </strong>
            <strong>
              5.8%<small>Engagement</small>
            </strong>
            <strong>
              4.9<small>Rating</small>
            </strong>
          </div>
        </div>
      )}
      {(lowerTitle.includes("edit profile") || lowerTitle.includes("business profile")) && (
        <div className="flow-form-card">
          <label>
            {isCreator ? "Display name" : "Business name"}
            <input defaultValue={isCreator ? "Aarohi Mehta" : "The Loom"} />
          </label>
          <label>
            Bio
            <textarea
              defaultValue={
                isCreator
                  ? "Fashion, beauty and everyday colour from Mumbai."
                  : "Modern Indian colour, crafted for everyday life."
              }
            />
          </label>
          <label>
            Location
            <input defaultValue="Mumbai, India" />
          </label>
          <label>
            Website
            <input defaultValue={isCreator ? "aarohimehta.com" : "theloom.in"} />
          </label>
        </div>
      )}
      {lowerTitle.includes("portfolio") && (
        <>
          <div className="portfolio-grid">
            {[0, 1, 2, 3].map((item) => (
              <button onClick={onSaved} key={item}>
                {item < 3 ? (
                  <img src={`${creators[item % creators.length].image}`} alt="" />
                ) : (
                  <>
                    <Icon name="plus" size={22} />
                    <span>Add sample</span>
                  </>
                )}
              </button>
            ))}
          </div>
          <div className="flow-form-card">
            <label>
              Sample title
              <input placeholder="e.g. Summer skincare routine" />
            </label>
            <label>
              Content link
              <input placeholder="https://" />
            </label>
          </div>
        </>
      )}
      {lowerTitle.includes("social") && (
        <div className="settings-list">
          {[
            ["instagram", "Instagram", "@aarohi.edits", "Connected"],
            ["youtube", "YouTube", "Aarohi Creates", "Connected"],
            ["facebook", "Facebook", "Aarohi Mehta", "Add"],
          ].map(([icon, network, handle, status]) => (
            <button onClick={onSaved} key={network}>
              <span>
                <Icon name={icon as IconName} size={17} />
              </span>
              <p>
                <strong>{network}</strong>
                <small>{handle}</small>
              </p>
              <b>{status}</b>
            </button>
          ))}
        </div>
      )}
      {(lowerTitle.includes("pricing") ||
        lowerTitle.includes("billing") ||
        lowerTitle.includes("payment")) && (
        <div className="flow-form-card">
          {isCreator ? (
            <>
              <label>
                Instagram Reel
                <input defaultValue="₹28,000" />
              </label>
              <label>
                Story set
                <input defaultValue="₹8,000" />
              </label>
              <label>
                UGC video
                <input defaultValue="₹18,000" />
              </label>
              <label>
                Bundle
                <input defaultValue="₹42,000" />
              </label>
            </>
          ) : (
            <>
              <div className="payout-method">
                <span>
                  <Icon name="wallet" size={18} />
                </span>
                <p>
                  <strong>Visa ···· 9024</strong>
                  <small>Primary business card</small>
                </p>
                <Icon name="check" size={15} />
              </div>
              <label>
                Billing email
                <input defaultValue="finance@theloom.in" />
              </label>
              <button className="flow-secondary-action" onClick={onSaved}>
                View invoices
              </button>
            </>
          )}
        </div>
      )}
      {lowerTitle.includes("availability") && (
        <div className="availability-flow">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
            (day, index) => (
              <ToggleRow
                key={day}
                label={day}
                detail={index < 5 ? "10:00 AM – 6:00 PM" : "Unavailable"}
              />
            ),
          )}
        </div>
      )}
      {lowerTitle.includes("verification") && (
        <div className="verification-flow">
          <span>
            <Icon name="shield" size={28} />
          </span>
          <small>IDENTITY VERIFIED</small>
          <h2>Your profile is trusted.</h2>
          <p>
            Face verification, mobile number, email, and connected social accounts are confirmed.
          </p>
          {["Government identity", "Face liveness", "Instagram ownership"].map((item) => (
            <div key={item}>
              <Icon name="check" size={12} /> {item}
              <b>Verified</b>
            </div>
          ))}
        </div>
      )}
      {(lowerTitle.includes("notification") ||
        lowerTitle.includes("privacy") ||
        lowerTitle.includes("settings")) && (
        <div className="availability-flow">
          {[
            "Campaign updates",
            "New messages",
            "Payment activity",
            "Marketing insights",
            "Profile discovery",
          ].map((item) => (
            <ToggleRow key={item} label={item} detail={`Manage ${item.toLowerCase()}`} />
          ))}
        </div>
      )}
      {lowerTitle.includes("security") && (
        <>
          <div className="flow-form-card">
            <label>
              Current password
              <input type="password" placeholder="Enter current password" />
            </label>
            <label>
              New password
              <input type="password" placeholder="At least 8 characters" />
            </label>
            <label>
              Confirm password
              <input type="password" placeholder="Repeat new password" />
            </label>
            <ToggleRow
              label="Two-step verification"
              detail="Require a mobile code when signing in"
            />
          </div>
          <div className="flow-detail-stack">
            <section>
              <span>ACTIVE SESSION</span>
              <h3>Chrome on macOS</h3>
              <p>Mumbai, India · Active now</p>
              <button onClick={onSaved}>Sign out other sessions</button>
            </section>
          </div>
        </>
      )}
      {lowerTitle.includes("language") && (
        <div className="flow-form-card">
          <label>
            App language
            <select defaultValue="English">
              <option>English</option>
              <option>Hindi</option>
              <option>Marathi</option>
              <option>Tamil</option>
              <option>Telugu</option>
            </select>
          </label>
          <label>
            Region
            <select defaultValue="India">
              <option>India</option>
              <option>Singapore</option>
              <option>United Arab Emirates</option>
            </select>
          </label>
          <label>
            Currency
            <select defaultValue="INR">
              <option>INR · Indian Rupee</option>
              <option>USD · US Dollar</option>
            </select>
          </label>
          <label>
            Time zone
            <select defaultValue="IST">
              <option>IST · Kolkata</option>
              <option>GST · Dubai</option>
            </select>
          </label>
        </div>
      )}
      {(lowerTitle.includes("connected app") || lowerTitle.includes("integration")) && (
        <div className="settings-list">
          {[
            ["instagram", "Instagram", "Connected", "@aarohi.edits"],
            ["youtube", "YouTube", "Connected", "Aarohi Creates"],
            ["calendar", "Google Calendar", "Available", "Sync campaign deadlines"],
            ["link", "Shopify", "Available", "Track creator conversions"],
          ].map(([icon, name, status, detail]) => (
            <button onClick={onSaved} key={name}>
              <span>
                <Icon name={icon as IconName} size={17} />
              </span>
              <p>
                <strong>{name}</strong>
                <small>{detail}</small>
              </p>
              <b>{status}</b>
            </button>
          ))}
        </div>
      )}
      {lowerTitle.includes("appearance") && (
        <>
          <div className="appearance-options">
            {["Light", "System", "Dark"].map((theme) => (
              <button
                className={selected === theme ? "active" : ""}
                onClick={() => setSelected(theme)}
                key={theme}
              >
                <i className={`theme-preview ${theme.toLowerCase()}`}>
                  <b />
                  <span />
                </i>
                <strong>{theme}</strong>
                <small>{theme === "System" ? "Follow device setting" : `${theme} interface`}</small>
              </button>
            ))}
          </div>
          <ToggleRow label="Reduce motion" detail="Minimize non-essential interface animation" />
        </>
      )}
      {lowerTitle.includes("about") && (
        <div className="about-orbitly-card">
          <span>
            <Icon name="sparkles" size={27} />
          </span>
          <small>ORBITLY FOR INDIA</small>
          <h2>Creators and brands, in better orbit.</h2>
          <p>
            Orbitly helps trusted creators and ambitious brands discover each other, collaborate,
            and grow with clarity.
          </p>
          <div>
            <strong>Version</strong>
            <span>1.0 prototype</span>
          </div>
          <div>
            <strong>Privacy policy</strong>
            <Icon name="chevron" size={13} />
          </div>
          <div>
            <strong>Terms of service</strong>
            <Icon name="chevron" size={13} />
          </div>
        </div>
      )}
      {lowerTitle.includes("team") && (
        <>
          <div className="settings-list">
            {[
              ["NK", "Neha Kapoor", "Owner"],
              ["AS", "Anika Shah", "Campaign manager"],
              ["RP", "Rohan Patel", "Finance"],
            ].map(([mark, name, roleName]) => (
              <button onClick={onSaved} key={name}>
                <span>{mark}</span>
                <p>
                  <strong>{name}</strong>
                  <small>{roleName}</small>
                </p>
                <Icon name="chevron" size={13} />
              </button>
            ))}
          </div>
          <div className="flow-form-card">
            <label>
              Invite by email
              <input placeholder="teammate@company.com" />
            </label>
            <label>
              Role
              <select>
                <option>Campaign manager</option>
                <option>Viewer</option>
                <option>Finance</option>
              </select>
            </label>
          </div>
        </>
      )}
      {lowerTitle.includes("subscription") && (
        <div className="subscription-card">
          <span>CURRENT PLAN</span>
          <h2>Growth</h2>
          <strong>
            ₹4,999<small>/month</small>
          </strong>
          <ul>
            <li>Unlimited creator discovery</li>
            <li>12 active campaigns</li>
            <li>Advanced reports</li>
            <li>5 team seats</li>
          </ul>
          <button onClick={onSaved}>Compare plans</button>
        </div>
      )}
      {(lowerTitle.includes("support") || lowerTitle.includes("safety")) && (
        <div className="flow-form-card">
          <label>
            How can we help?
            <select>
              <option>Account question</option>
              <option>Report a safety issue</option>
              <option>Payment support</option>
            </select>
          </label>
          <label>
            Details
            <textarea placeholder="Tell the Orbitly team what happened…" />
          </label>
        </div>
      )}
      {simpleChoice && (
        <div className="choice-list">
          {(lowerTitle.includes("sort")
            ? ["Recommended", "Highest pay", "Best match", "Deadline"]
            : lowerTitle.includes("date") || lowerTitle.includes("calendar")
              ? ["This month", "Last 30 days", "Last 90 days", "Custom range"]
              : lowerTitle.includes("attachment") || lowerTitle.includes("media")
                ? ["Photo library", "Campaign document", "Camera", "Portfolio file"]
                : lowerTitle.includes("filter")
                  ? ["Fashion", "Beauty", "UGC", "Nearby", "₹20K+", "Available now"]
                  : ["Create campaign", "Find creators", "Invite", "Ask AI"]
          ).map((item) => (
            <button
              className={selected === item ? "active" : ""}
              onClick={() => setSelected(item)}
              key={item}
            >
              <i>{selected === item && <Icon name="check" size={10} />}</i>
              <strong>{item}</strong>
            </button>
          ))}
        </div>
      )}
      {lowerTitle.includes("receipt") && (
        <div className="payment-receipt-card compact">
          <span>TRANSACTION RECEIPT</span>
          <h3>{context ?? "Summer Edit milestone"}</h3>
          <strong>₹18,000</strong>
          <p>Paid 18 Jun · UTR ORB4821098</p>
        </div>
      )}
      {!lowerTitle.includes("public profile") &&
        !lowerTitle.includes("verification") &&
        !lowerTitle.includes("subscription") &&
        !lowerTitle.includes("about") && (
          <button className="profile-save-button" onClick={onSaved}>
            {lowerTitle.includes("support")
              ? "Submit request"
              : simpleChoice
                ? "Apply selection"
                : "Save changes"}
          </button>
        )}
      {!lowerTitle.includes("about") && (
        <p className="settings-save-note">
          <Icon name="shield" size={12} />
          Your account information is stored securely.
        </p>
      )}
    </div>
  );
}
