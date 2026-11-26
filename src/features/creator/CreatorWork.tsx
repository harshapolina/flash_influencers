import { useEffect, useState } from "react";
import { formatInr } from "../../data";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import { StatusBar } from "../../components/ui/StatusBar";
import type { AppFlow, Booking } from "../../types";

export function CreatorWorkScreen({
  onOpen,
  applicationSubmitted = false,
}: {
  onOpen?: (flow: AppFlow) => void;
  applicationSubmitted?: boolean;
  onOpenOpportunities?: () => void;
}) {
  const { updateBookingStatus, refreshBookings, verifyBookingStart } = useAppStore();
  const [activeTab, setActiveTab] = useState<"Active" | "Applications" | "Completed">("Applications");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [otpDraft, setOtpDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const loadBookings = async () => {
    try {
      const data = await api.listBookings();
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [activeTab]);

  const pending = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter(
    (b) => b.status === "accepted" || b.status === "in_progress",
  );
  const closed = bookings.filter((b) => b.status === "completed" || b.status === "rejected");

  const respond = async (id: string, status: "accepted" | "rejected") => {
    setBusyId(id);
    setError("");
    try {
      await updateBookingStatus(id, status);
      await refreshBookings();
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update booking");
    } finally {
      setBusyId(null);
    }
  };

  const startWithOtp = async (id: string) => {
    const code = (otpDraft[id] || "").trim();
    if (code.length < 4) {
      setError("Enter the start OTP from the brand");
      return;
    }
    setBusyId(id);
    setError("");
    try {
      await verifyBookingStart(id, code);
      setOtpDraft((d) => ({ ...d, [id]: "" }));
      await refreshBookings();
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start booking");
    } finally {
      setBusyId(null);
    }
  };

  const bookingCards = (list: Booking[]) =>
    list.map((booking) => (
      <article key={booking.id} className="creator-booking-card" style={{ margin: "0 16px 10px" }}>
        <header>
          <span className={`booking-type-chip ${booking.bookingType || "scheduled"}`}>
            {booking.bookingType === "instant" ? "Instant" : "Scheduled"}
          </span>
          <strong>#{booking.id}</strong>
        </header>
        <h3>{booking.deliverable}</h3>
        <p>
          {booking.brandName || "Brand"} · {booking.date}
          {booking.time ? ` · ${booking.time}` : ""} · {booking.location}
        </p>
        <p className="creator-booking-price">{formatInr(booking.price)}</p>
        {booking.status === "pending" ? (
          <div className="creator-booking-actions">
            <button
              type="button"
              className="ghost-sheet-btn"
              disabled={busyId === booking.id}
              onClick={() => respond(booking.id, "rejected")}
            >
              Decline
            </button>
            <button
              type="button"
              className="apply-button"
              disabled={busyId === booking.id}
              onClick={() => respond(booking.id, "accepted")}
            >
              {busyId === booking.id ? "Updating…" : "Accept"}
            </button>
          </div>
        ) : booking.status === "accepted" ? (
          <div className="creator-booking-actions" style={{ flexDirection: "column", gap: 8 }}>
            <input
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter start OTP"
              value={otpDraft[booking.id] || ""}
              onChange={(e) =>
                setOtpDraft((d) => ({ ...d, [booking.id]: e.target.value.replace(/\D/g, "") }))
              }
              style={{
                width: "100%",
                border: "1px solid #d8ddd2",
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
            <button
              type="button"
              className="apply-button"
              disabled={busyId === booking.id}
              onClick={() => void startWithOtp(booking.id)}
            >
              {busyId === booking.id ? "Starting…" : "Start collaboration"}
            </button>
          </div>
        ) : (
          <footer>
            <span>{booking.status === "in_progress" ? "In progress" : booking.status}</span>
          </footer>
        )}
      </article>
    ));

  return (
    <div className="screen creator-work-screen">
      <StatusBar />
      <header className="creator-section-head">
        <div>
          <small>MY WORK</small>
          <h1>Campaigns</h1>
        </div>
        <button
          className="round-button"
          onClick={() =>
            onOpen?.({ name: "profile-section", role: "creator", title: "Campaign calendar" })
          }
          aria-label="Campaign calendar"
        >
          <Icon name="calendar" size={18} />
        </button>
      </header>
      <div className="campaign-tabs creator-work-tabs">
        {(["Active", "Applications", "Completed"] as const).map((tab) => (
          <button
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {tab}
            {tab === "Active" && <span>{4 + activeBookings.length}</span>}
            {tab === "Applications" && (
              <span>{pending.length + (applicationSubmitted ? 1 : 0)}</span>
            )}
            {tab === "Completed" && closed.length > 0 && <span>{2 + closed.length}</span>}
          </button>
        ))}
      </div>
      {error ? <p className="booking-error">{error}</p> : null}
      {activeTab === "Active" && (
        <>
          {activeBookings.length > 0 && bookingCards(activeBookings)}
          <section
            className="next-deadline"
            onClick={() => onOpen?.({ name: "creator-campaign", role: "creator" })}
          >
            <div className="deadline-date">
              <strong>28</strong>
              <span>JUN</span>
            </div>
            <div>
              <span>NEXT DEADLINE · TOMORROW</span>
              <strong>Submit final reel</strong>
              <small>The Loom · Summer Edit 2025</small>
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onOpen?.({ name: "creator-campaign", role: "creator" });
              }}
              aria-label="Open next deadline"
            >
              <Icon name="chevron" size={15} />
            </button>
          </section>
          <div className="creator-work-list">
            {[
              ["The Loom", "Summer Edit 2025", "Content review", "75%", "#dfff4f"],
              ["Nura Beauty", "Monsoon Skin Reset", "Draft in progress", "45%", "#c9bcff"],
              ["Flex Society", "Everyday Active", "Product shipped", "25%", "#ffcf91"],
            ].map(([brand, title, status, progress, color], index) => (
              <article key={title}>
                <div className="work-card-top" style={{ background: color }}>
                  <span>{brand.slice(0, 2).toUpperCase()}</span>
                  <b>IN PROGRESS</b>
                  <i>{index + 1}</i>
                </div>
                <div className="work-card-body">
                  <span>{brand}</span>
                  <h3>{title}</h3>
                  <p>
                    <i />
                    <strong>{status}</strong>
                    <b>{progress}</b>
                  </p>
                  <div>
                    <i style={{ width: progress }} />
                  </div>
                  <footer>
                    <span>
                      <Icon name="calendar" size={12} />
                      Due {28 + index * 3} Jun
                    </span>
                    <button onClick={() => onOpen?.({ name: "creator-campaign", role: "creator" })}>
                      Open campaign <Icon name="arrow" size={13} />
                    </button>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {activeTab === "Applications" && (
        <>
          {pending.length > 0 && bookingCards(pending)}
          <div className="flow-inline-list">
            {applicationSubmitted ? (
              <button
                className="flow-inline-card"
                onClick={() =>
                  onOpen?.({
                    name: "opportunity",
                    role: "creator",
                    title: "Monsoon Skin Reset",
                    context: "Nura Beauty",
                  })
                }
              >
                <span className="flow-brand-mark">NB</span>
                <p>
                  <small>APPLICATION SUBMITTED</small>
                  <strong>Monsoon Skin Reset</strong>
                  <span>Nura Beauty · Under review</span>
                </p>
                <Icon name="chevron" size={14} />
              </button>
            ) : !pending.length ? (
              <div className="empty">
                <span>
                  <Icon name="briefcase" size={24} />
                </span>
                <h3>No applications yet</h3>
                <p>Apply to an opportunity and track it here. Booking requests also appear here.</p>
              </div>
            ) : null}
          </div>
        </>
      )}
      {activeTab === "Completed" && (
        <>
          {closed.length > 0 && bookingCards(closed)}
          <div className="flow-inline-list">
            {["Winter Layers", "Festive Edit"].map((title, index) => (
              <button
                className="flow-inline-card"
                onClick={() => onOpen?.({ name: "creator-campaign", role: "creator", title })}
                key={title}
              >
                <span className="flow-brand-mark">{index ? "NB" : "TL"}</span>
                <p>
                  <small>COMPLETED · PAID</small>
                  <strong>{title}</strong>
                  <span>₹{index ? "24,000" : "32,000"} · 4.9 rating</span>
                </p>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
