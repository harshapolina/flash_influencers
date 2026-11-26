import { useState } from "react";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import type { Campaign } from "../../types";

export function CreatorBriefSheet({
  campaign,
  onClose,
  onChat,
}: {
  campaign: Campaign;
  onClose: () => void;
  onChat?: (threadId: string) => void;
}) {
  const { state, applyCampaign, toggleSaveCampaign } = useAppStore();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const applied = state.appliedCampaignIds.includes(campaign.id);
  const saved = state.savedCampaignIds.includes(campaign.id);
  const isBooking = Boolean(campaign.bookingId);
  const accepted = isBooking && applied;

  const apply = async () => {
    if ((applied && !isBooking) || accepted || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await applyCampaign(campaign.id);
      if (result.threadId) setThreadId(result.threadId);
      setNotice(
        isBooking
          ? "You’re in. Message the brand or open Work → Active."
          : "Application sent. Check Work → Applications.",
      );
    } catch {
      setNotice("Could not complete this action. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (saveBusy) return;
    setSaveBusy(true);
    setNotice("");
    try {
      await toggleSaveCampaign(campaign.id);
      setNotice(saved ? "Removed from saved." : "Saved to your list.");
    } catch {
      setNotice("Could not update saved campaigns.");
    } finally {
      setSaveBusy(false);
    }
  };

  const activeThread = threadId;
  const canMessage = Boolean(activeThread && onChat);

  const briefText =
    campaign.brief ||
    `${campaign.brand} is looking for creators to deliver ${campaign.type.toLowerCase()}. Share an authentic take that fits your audience, keep brand mentions natural, and submit drafts before the apply-by date.`;

  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="bottom-sheet creator-brief-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header>
          <div>
            <span>
              {campaign.brand} ·{" "}
              {isBooking
                ? campaign.bookingMode === "instant"
                  ? "INSTANT BOOK"
                  : "SCHEDULED BOOK"
                : "VERIFIED"}
            </span>
            <h2>{campaign.title}</h2>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </header>
        <div className="brief-hero">
          <span className="brief-mark">{campaign.icon}</span>
          <div>
            <small>CREATOR PAY</small>
            <strong>{campaign.pay}</strong>
          </div>
          <div>
            <small>MATCH</small>
            <strong>
              {typeof campaign.match === "number" ? `${campaign.match}%` : "Open"}
            </strong>
          </div>
        </div>
        <div className="brief-meta">
          <span>
            <Icon name="camera" size={13} /> {campaign.type}
          </span>
          <span>
            <Icon name="calendar" size={13} /> {isBooking ? "Due" : "Apply by"} {campaign.applyBy}
          </span>
          <span>
            <Icon name="pin" size={13} /> {campaign.location || "Remote / India"}
          </span>
        </div>
        <div className="campaign-tags">
          {(campaign.tags?.length ? campaign.tags : ["Paid", "Usage rights", "Brief ready"]).map(
            (tag) => (
              <b key={tag}>{tag}</b>
            ),
          )}
        </div>
        <section className="brief-section">
          <h3>Campaign brief</h3>
          <p>{briefText}</p>
        </section>
        <section className="brief-section">
          <h3>Deliverables</h3>
          <ul>
            <li>{campaign.deliverables || campaign.type}</li>
            <li>Caption + story frames as needed</li>
            <li>Usage window: 90 days</li>
          </ul>
        </section>
        {notice && <p className={`flow-error ${/Could not|fail/i.test(notice) ? "" : "flow-success"}`}>{notice}</p>}
        <footer className={`brief-actions ${canMessage ? "brief-actions-stack" : ""}`}>
          <button type="button" className="brief-save" disabled={saveBusy} onClick={() => void save()}>
            <Icon name="bookmark" size={16} fill={saved} />
            {saveBusy ? "…" : saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            className="flow-primary"
            disabled={(applied && !isBooking) || accepted || busy}
            onClick={() => void apply()}
          >
            {isBooking
              ? busy
                ? "Confirming…"
                : accepted
                  ? "Accepted"
                  : "OK to work"
              : applied
                ? "Applied"
                : busy
                  ? "Sending…"
                  : "Apply now"}{" "}
            <Icon name="arrow" size={15} />
          </button>
          {canMessage && (
            <button
              type="button"
              className="work-chat-btn"
              onClick={() => {
                onChat?.(activeThread!);
                onClose();
              }}
            >
              <Icon name="message" size={14} /> Message brand
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
