import { useMemo, useState } from "react";
import { DELIVERABLES, PLATFORM_FEE_RATE, formatInr } from "../../data";
import { Icon } from "../../lib/icons";
import type { Creator } from "../../types";

export function BookingSheet({
  creator,
  successId,
  onSuccess,
  onClose,
}: {
  creator: Creator;
  successId: string | null;
  onSuccess: (payload: {
    deliverable: string;
    price: number;
    date: string;
    location: string;
    mode: "instant" | "schedule";
    brief: string;
  }) => void;
  onClose: () => void;
}) {
  const [deliverableId, setDeliverableId] = useState<(typeof DELIVERABLES)[number]["id"]>("reel");
  const [date, setDate] = useState("28 Jun");
  const [location, setLocation] = useState(creator.city);
  const [mode, setMode] = useState<"instant" | "schedule">("schedule");
  const [brief, setBrief] = useState("");

  const selected = DELIVERABLES.find((d) => d.id === deliverableId) ?? DELIVERABLES[0];
  const subtotal = Math.round(creator.priceValue * selected.multiplier);
  const fee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const total = subtotal + fee;

  const dates = useMemo(() => ["28 Jun", "02 Jul", "05 Jul", "12 Jul"], []);
  const locations = useMemo(() => ["Mumbai", "Delhi", "Bengaluru", "Pune", "Remote"], []);

  if (successId) {
    return (
      <div className="sheet-layer">
        <div className="bottom-sheet booking-success">
          <div className="success-check">
            <Icon name="check" size={30} />
          </div>
          <h2>{mode === "instant" ? "Booked instantly" : "Request sent"}</h2>
          <p>
            {mode === "instant"
              ? `${creator.name.split(" ")[0]} is confirmed. Chat is open and work is live on their Active tab.`
              : `${creator.name.split(" ")[0]} has 24 hours to OK this schedule. They’ll get a notification, Active work card, and full brief.`}
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
            <small>{creator.handle}</small>
          </p>
          <span>
            <Icon name="star" fill size={12} />
            4.9
          </span>
        </div>

        <label>BOOKING TYPE</label>
        <div className="option-pills booking-mode-pills">
          <button
            type="button"
            className={mode === "instant" ? "active" : ""}
            onClick={() => setMode("instant")}
          >
            Instant
          </button>
          <button
            type="button"
            className={mode === "schedule" ? "active" : ""}
            onClick={() => setMode("schedule")}
          >
            Schedule
          </button>
        </div>
        <p className="booking-mode-hint">
          {mode === "instant"
            ? "Confirms immediately. Creator sees Active work + chat right away."
            : "Sends an invite. Creator gets a notification and must tap OK to work."}
        </p>

        <label>SELECT DELIVERABLE</label>
        {DELIVERABLES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`deliverable ${deliverableId === item.id ? "active" : ""}`}
            onClick={() => setDeliverableId(item.id)}
          >
            <i />
            <p>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </p>
            <b>{formatInr(Math.round(creator.priceValue * item.multiplier))}</b>
          </button>
        ))}
        <div className="date-location">
          <button
            type="button"
            onClick={() => {
              const idx = dates.indexOf(date);
              setDate(dates[(idx + 1) % dates.length]);
            }}
          >
            <span>CAMPAIGN DATE</span>
            <strong>
              <Icon name="calendar" size={15} />
              {date}
            </strong>
          </button>
          <button
            type="button"
            onClick={() => {
              const idx = locations.indexOf(location);
              setLocation(locations[(idx + 1) % locations.length]);
            }}
          >
            <span>LOCATION</span>
            <strong>
              <Icon name="pin" size={15} />
              {location}
            </strong>
          </button>
        </div>

        <label>BRIEF (OPTIONAL)</label>
        <textarea
          className="booking-brief-input"
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Key messages, must-include products, tone, references…"
        />

        <div className="booking-total">
          <span>
            Estimated total <small>Includes {formatInr(fee)} platform fee</small>
          </span>
          <strong>{formatInr(total)}</strong>
        </div>
        <button
          className="apply-button"
          type="button"
          onClick={() =>
            onSuccess({
              deliverable: selected.title,
              price: total,
              date,
              location,
              mode,
              brief: brief.trim(),
            })
          }
        >
          {mode === "instant" ? "Book instantly" : "Send schedule request"}{" "}
          <Icon name="arrow" size={16} />
        </button>
        <p className="booking-note">
          <Icon name="shield" size={13} />{" "}
          {mode === "instant"
            ? `Chat opens immediately with ${creator.name.split(" ")[0]}`
            : `No charge until ${creator.name.split(" ")[0]} accepts`}
        </p>
      </div>
    </div>
  );
}
