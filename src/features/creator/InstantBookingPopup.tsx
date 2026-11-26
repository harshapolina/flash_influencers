import { useCallback, useEffect, useState } from "react";
import { formatInr } from "../../data";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import type { Booking } from "../../types";

/** Full-screen popup when a brand sends an instant booking request. */
export function InstantBookingPopup({ onOpenWork }: { onOpenWork?: () => void }) {
  const { updateBookingStatus, refreshBookings } = useAppStore();
  const [request, setRequest] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await api.listBookings();
      const pendingInstant = (data.bookings || []).find(
        (b) =>
          b.status === "pending" &&
          (b.bookingType === "instant" || b.mode === "instant") &&
          !dismissedIds.includes(b.id),
      );
      setRequest(pendingInstant || null);
    } catch {
      /* keep quiet if offline */
    }
  }, [dismissedIds]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  if (!request) return null;

  const respond = async (status: "accepted" | "rejected") => {
    setBusy(true);
    setError("");
    try {
      await updateBookingStatus(request.id, status);
      await refreshBookings();
      setDismissedIds((ids) => [...ids, request.id]);
      setRequest(null);
      if (status === "accepted") onOpenWork?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update booking");
    } finally {
      setBusy(false);
    }
  };

  const whenValue = [request.date, request.time].filter(Boolean).join(" · ");

  return (
    <div className="request-status-layer" role="dialog" aria-label="Instant booking request">
      <section className="request-status-popup instant-booking-popup">
        <button
          className="request-popup-close"
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            setDismissedIds((ids) => [...ids, request.id]);
            setRequest(null);
          }}
        >
          <Icon name="close" size={16} />
        </button>

        <div className="ibp-icon" aria-hidden>
          <Icon name="briefcase" size={22} />
        </div>

        <small className="ibp-eyebrow">Instant booking request</small>
        <h2 className="ibp-title">{request.brandName || "A brand"} wants to book you now</h2>

        <p className="ibp-amount">{formatInr(request.price)}</p>
        <span className="ibp-amount-label">Payout</span>

        <dl className="ibp-facts">
          <div className="ibp-fact">
            <dt>Deliverable</dt>
            <dd>{request.deliverable || "—"}</dd>
          </div>
          {whenValue ? (
            <div className="ibp-fact">
              <dt>When</dt>
              <dd>{whenValue}</dd>
            </div>
          ) : null}
          {request.location ? (
            <div className="ibp-fact">
              <dt>Where</dt>
              <dd>{request.location}</dd>
            </div>
          ) : null}
          {request.brief ? (
            <div className="ibp-fact ibp-fact-brief">
              <dt>Brief</dt>
              <dd>{request.brief}</dd>
            </div>
          ) : null}
        </dl>

        {error ? <p className="booking-error ibp-error">{error}</p> : null}

        <div className="ibp-actions">
          <button
            type="button"
            className="incoming-decline"
            disabled={busy}
            onClick={() => void respond("rejected")}
          >
            Decline
          </button>
          <button
            type="button"
            className="incoming-accept"
            disabled={busy}
            onClick={() => void respond("accepted")}
          >
            {busy ? "Updating…" : "Accept request"}
          </button>
        </div>

        <button
          type="button"
          className="request-keep-swiping ibp-secondary"
          onClick={() => onOpenWork?.()}
        >
          View in Work <Icon name="arrow" size={13} />
        </button>
      </section>
    </div>
  );
}
