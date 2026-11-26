import { useEffect, useState } from "react";
import { creators } from "../../data";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import { StatusBar } from "../../components/ui/StatusBar";
import type { AppFlow, Booking } from "../../types";

export function CampaignScreen({
  onOpen,
  onOpenFlow,
  campaignPublished = false,
  paymentComplete = false,
}: {
  onOpen?: (flow: AppFlow) => void;
  onOpenFlow?: (flow: AppFlow) => void;
  campaignPublished?: boolean;
  paymentComplete?: boolean;
  onOpenExplore?: () => void;
  initialTab?: "active" | "applications" | "completed";
}) {
  const open = onOpen || onOpenFlow;
  const { issueBookingStartOtp, updateBookingStatus, refreshBookings } = useAppStore();

  const [activeTab, setActiveTab] = useState<"Active" | "Applications" | "Completed">("Active");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [otpById, setOtpById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await api.listBookings();
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    void load();
  }, [activeTab]);

  const pending = bookings.filter((b) => b.status === "pending");
  const live = bookings.filter((b) => b.status === "accepted" || b.status === "in_progress");
  const done = bookings.filter((b) => b.status === "completed");

  const generateOtp = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const data = await issueBookingStartOtp(id);
      setOtpById((m) => ({ ...m, [id]: data.code }));
      await refreshBookings();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate OTP");
    } finally {
      setBusyId(null);
    }
  };

  const completeBooking = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      await updateBookingStatus(id, "completed");
      await refreshBookings();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete booking");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="screen simple-screen">
      <StatusBar />
      <header className="simple-head">
        <div>
          <small>YOUR WORK</small>
          <h1>Campaigns</h1>
        </div>
        <button
          className="round-button dark"
          onClick={() => open?.({ name: "campaign-create", role: "brand" })}
          aria-label="Create campaign"
        >
          <Icon name="plus" />
        </button>
      </header>
      <div className="campaign-tabs">
        {(["Active", "Applications", "Completed"] as const).map((tab) => (
          <button
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {tab}
            {tab === "Active" && <span>{(campaignPublished ? 5 : 4) + live.length}</span>}
            {tab === "Applications" && pending.length > 0 && <span>{pending.length}</span>}
          </button>
        ))}
      </div>
      {error ? <p className="booking-error">{error}</p> : null}
      {activeTab === "Active" && (
        <>
          <div className="active-campaign">
            <div className="campaign-cover">
              <div>
                <span>THE LOOM</span>
                <h2>
                  Summer
                  <br />
                  in colour.
                </h2>
              </div>
              <span className="status-chip">IN PROGRESS</span>
            </div>
            <div className="campaign-body">
              <div>
                <strong>Summer Edit 2025</strong>
                <span>6 of 8 creators confirmed</span>
              </div>
              <button
                onClick={() => open?.({ name: "brand-campaign", role: "brand" })}
                aria-label="Open campaign"
              >
                <Icon name="chevron" size={16} />
              </button>
              <div className="progress">
                <span style={{ width: "72%" }} />
              </div>
              <footer>
                <span>
                  <Icon name="calendar" size={14} /> Due 28 Jun
                </span>
                <span>
                  <Icon name="camera" size={14} /> 12 deliverables
                </span>
              </footer>
            </div>
          </div>
          {live.length > 0 && (
            <>
              <h3 className="small-title">Live bookings</h3>
              <div className="flow-inline-list">
                {live.map((booking) => (
                  <div className="flow-inline-card" key={booking.id} style={{ display: "block" }}>
                    <p>
                      <small>
                        {booking.bookingType === "instant" ? "INSTANT" : "SCHEDULED"} ·{" "}
                        {booking.status === "in_progress" ? "IN PROGRESS" : "ACCEPTED"}
                      </small>
                      <strong>
                        {booking.creatorName || "Creator"} · {booking.deliverable}
                      </strong>
                      <span>
                        #{booking.id} · {booking.date}
                        {booking.time ? ` · ${booking.time}` : ""}
                      </span>
                    </p>
                    {booking.status === "accepted" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="apply-button"
                          disabled={busyId === booking.id}
                          onClick={() => void generateOtp(booking.id)}
                        >
                          {busyId === booking.id ? "Generating…" : "Generate start OTP"}
                        </button>
                        {otpById[booking.id] && (
                          <strong style={{ alignSelf: "center", letterSpacing: 2 }}>
                            OTP {otpById[booking.id]}
                          </strong>
                        )}
                      </div>
                    )}
                    {booking.status === "in_progress" && (
                      <button
                        type="button"
                        className="apply-button"
                        style={{ marginTop: 8 }}
                        disabled={busyId === booking.id}
                        onClick={() => void completeBooking(booking.id)}
                      >
                        {busyId === booking.id ? "Completing…" : "Mark complete"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <h3 className="small-title">Needs attention</h3>
          <div className="task-list">
            <button onClick={() => open?.({ name: "submissions", role: "brand" })}>
              <span className="task-icon">
                <Icon name="camera" />
              </span>
              <p>
                <strong>3 submissions to review</strong>
                <small>Summer Edit 2025</small>
              </p>
              <Icon name="chevron" />
            </button>
            <button onClick={() => open?.({ name: "applications", role: "brand" })}>
              <span className="task-icon yellow">
                <Icon name="clock" />
              </span>
              <p>
                <strong>2 responses expiring soon</strong>
                <small>Monsoon Stories</small>
              </p>
              <Icon name="chevron" />
            </button>
          </div>
          {campaignPublished && (
            <button
              className="flow-inline-card campaign-added-card"
              onClick={() =>
                open?.({ name: "brand-campaign", role: "brand", title: "New campaign" })
              }
            >
              <span className="flow-brand-mark">TL</span>
              <p>
                <small>JUST PUBLISHED</small>
                <strong>New creator campaign</strong>
                <span>Recruiting creators now</span>
              </p>
              <Icon name="chevron" size={14} />
            </button>
          )}
          {paymentComplete && (
            <p className="campaign-paid-note">
              <Icon name="check" size={12} /> Latest creator payment completed
            </p>
          )}
        </>
      )}
      {activeTab === "Applications" && (
        <div className="flow-inline-list">
          {pending.length > 0
            ? pending.map((booking) => (
                <div className="flow-inline-card" key={booking.id}>
                  <span className="flow-brand-mark">
                    {(booking.creatorName || "CR").slice(0, 2).toUpperCase()}
                  </span>
                  <p>
                    <small>PENDING · {booking.bookingType === "instant" ? "INSTANT" : "SCHEDULED"}</small>
                    <strong>
                      {booking.creatorName || "Creator"} · {booking.deliverable}
                    </strong>
                    <span>
                      #{booking.id} · {booking.date}
                    </span>
                  </p>
                </div>
              ))
            : creators.slice(0, 3).map((creator) => (
                <button
                  className="flow-inline-card"
                  onClick={() =>
                    open?.({ name: "applications", role: "brand", context: creator.name })
                  }
                  key={creator.id}
                >
                  <img src={creator.image} alt={creator.name} />
                  <p>
                    <small>{creator.match}% MATCH</small>
                    <strong>{creator.name}</strong>
                    <span>
                      {creator.niche} · {creator.price}
                    </span>
                  </p>
                  <Icon name="chevron" size={14} />
                </button>
              ))}
        </div>
      )}
      {activeTab === "Completed" && (
        <div className="flow-inline-list">
          {done.length > 0
            ? done.map((booking) => (
                <div className="flow-inline-card" key={booking.id}>
                  <span className="flow-brand-mark">
                    {(booking.creatorName || "OK").slice(0, 2).toUpperCase()}
                  </span>
                  <p>
                    <small>COMPLETED</small>
                    <strong>
                      {booking.creatorName || "Creator"} · {booking.deliverable}
                    </strong>
                    <span>#{booking.id}</span>
                  </p>
                </div>
              ))
            : ["Festive Stories", "Winter Essentials"].map((title, index) => (
                <button
                  className="flow-inline-card"
                  onClick={() => open?.({ name: "brand-analytics", role: "brand", title })}
                  key={title}
                >
                  <span className="flow-brand-mark">{index ? "WE" : "FS"}</span>
                  <p>
                    <small>COMPLETED</small>
                    <strong>{title}</strong>
                    <span>{index ? "2.4M reach" : "3.8M reach"} · View report</span>
                  </p>
                  <Icon name="chevron" size={14} />
                </button>
              ))}
        </div>
      )}
    </div>
  );
}
