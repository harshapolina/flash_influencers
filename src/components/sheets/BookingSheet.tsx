import { useState } from "react";
import { PLATFORM_FEE_RATE, formatInr } from "../../data";
import { Icon } from "../../lib/icons";
import type { BookingType, Creator } from "../../types";

export function BookingSheet({
  creator,
  successId,
  bookingType = "scheduled",
  onSuccess,
  onClose,
}: {
  creator: Creator;
  successId: string | null;
  bookingType?: BookingType;
  onSuccess: (payload: {
    deliverable: string;
    price: number;
    date: string;
    location: string;
    bookingType: BookingType;
    multiplier: number;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const [deliverable, setDeliverable] = useState<"reel" | "bundle">("reel");
  const [date, setDate] = useState(bookingType === "instant" ? "Today" : "28 Jun");
  const [location, setLocation] = useState(creator.city || "Mumbai");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const multiplier = deliverable === "bundle" ? 1.5 : 1;
  const subtotal = Math.round(creator.priceValue * multiplier);
  const fee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const total = subtotal + fee;
  const deliverableTitle = deliverable === "reel" ? "Instagram Reel" : "Reel + 3 Stories";

  if (successId) {
    return (
      <div className="sheet-layer">
        <div className="bottom-sheet booking-success">
          <div className="success-check">
            <Icon name="check" size={30} />
          </div>
          <h2>Request sent</h2>
          <p>
            {creator.name.split(" ")[0]} has 24 hours to respond. We’ll notify you when the status
            changes.
          </p>
          <div>
            <span>BOOKING ID</span>
            <strong>#{successId}</strong>
          </div>
          <button className="apply-button" type="button" onClick={onClose}>
            View booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="bottom-sheet booking-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header>
          <div>
            <span>BOOK CREATOR · 1 OF 3</span>
            <h2>Build your booking</h2>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="book-person">
          <img src={creator.image} alt="" />
          <p>
            <strong>{creator.name}</strong>
            <small>
              {creator.handle}
              {bookingType === "instant" ? " · Instant" : " · Scheduled"}
            </small>
          </p>
          <span>
            <Icon name="star" fill size={12} />
            4.9
          </span>
        </div>
        <label>SELECT DELIVERABLE</label>
        <button
          type="button"
          className={`deliverable ${deliverable === "reel" ? "active" : ""}`}
          onClick={() => setDeliverable("reel")}
        >
          <i />
          <p>
            <strong>Instagram Reel</strong>
            <small>Up to 60 sec · 1 revision</small>
          </p>
          <b>{formatInr(Math.round(creator.priceValue))}</b>
        </button>
        <button
          type="button"
          className={`deliverable ${deliverable === "bundle" ? "active" : ""}`}
          onClick={() => setDeliverable("bundle")}
        >
          <i />
          <p>
            <strong>Reel + 3 Stories</strong>
            <small>Campaign bundle · 1 revision</small>
          </p>
          <b>{formatInr(Math.round(creator.priceValue * 1.5))}</b>
        </button>
        <div className="date-location">
          <button
            type="button"
            onClick={() =>
              setDate((current) =>
                bookingType === "instant"
                  ? "Today"
                  : current === "28 Jun"
                    ? "2 Jul"
                    : "28 Jun",
              )
            }
          >
            <span>CAMPAIGN DATE</span>
            <strong>
              <Icon name="calendar" size={15} />
              {date}
            </strong>
          </button>
          <button
            type="button"
            onClick={() => setLocation((current) => (current === creator.city ? "Remote" : creator.city || "Mumbai"))}
          >
            <span>LOCATION</span>
            <strong>
              <Icon name="pin" size={15} />
              {location}
            </strong>
          </button>
        </div>
        <div className="booking-total">
          <span>
            Estimated total <small>Includes {formatInr(fee)} platform fee</small>
          </span>
          <strong>{formatInr(total)}</strong>
        </div>
        {error ? <p className="booking-error">{error}</p> : null}
        <button
          className="apply-button"
          type="button"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            setError("");
            try {
              await onSuccess({
                deliverable: deliverableTitle,
                price: total,
                date,
                location,
                bookingType,
                multiplier,
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not send booking");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "Sending…" : "Send booking request"}{" "}
          {!submitting && <Icon name="arrow" size={16} />}
        </button>
        <p className="booking-note">
          <Icon name="shield" size={13} /> No charge until {creator.name.split(" ")[0]} accepts
        </p>
      </div>
    </div>
  );
}
