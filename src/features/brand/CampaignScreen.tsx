import { useEffect, useState } from "react";
import { formatInr } from "../../data";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import { StatusBar } from "../../components/ui/StatusBar";
import type { BrandCampaign, Booking } from "../../types";

type CampaignTab = "active" | "applications" | "completed";

export function CampaignScreen({ onOpenExplore }: { onOpenExplore?: () => void }) {
  const { state } = useAppStore();
  const [tab, setTab] = useState<CampaignTab>("active");
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>(state.bookings);
  const [counts, setCounts] = useState({ active: 0, applications: 0, completed: 0 });

  useEffect(() => {
    let alive = true;
    api
      .listCampaigns({ status: tab })
      .then((data) => {
        if (!alive) return;
        setCampaigns(data.campaigns || []);
        setBookings(data.bookings || state.bookings);
        setCounts(data.counts || counts);
      })
      .catch(() => {
        setBookings(state.bookings);
      });
    return () => {
      alive = false;
    };
  }, [tab, state.bookings]);

  const list =
    tab === "applications"
      ? [
          ...campaigns.filter((c) => c.status === "applications"),
          ...bookings.map((b) => ({
            id: b.id,
            title: `${b.deliverable} booking`,
            brand: `Creator #${b.creatorId}`,
            status: "applications" as const,
            progress: 15,
            creatorsConfirmed: `Pending · ${b.date}`,
            due: b.date,
            deliverables: b.deliverable,
            needsAttention: `Booking ${b.id}`,
          })),
        ]
      : campaigns.filter((c) => c.status === tab);

  return (
    <div className="screen simple-screen">
      <StatusBar />
      <header className="simple-head">
        <div>
          <small>YOUR WORK</small>
          <h1>Campaigns</h1>
        </div>
        <button className="round-button dark" type="button" onClick={onOpenExplore}>
          <Icon name="plus" />
        </button>
      </header>
      <div className="campaign-tabs">
        {(
          [
            ["active", "Active", counts.active],
            ["applications", "Applications", counts.applications],
            ["completed", "Completed", counts.completed],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      {list[0] && tab === "active" && (
        <div className="active-campaign">
          <div className="campaign-cover">
            <div>
              <span>{list[0].brand.toUpperCase()}</span>
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
              <strong>{list[0].title}</strong>
              <span>{list[0].creatorsConfirmed}</span>
            </div>
            <button type="button">
              <Icon name="chevron" size={16} />
            </button>
            <div className="progress">
              <span style={{ width: `${list[0].progress}%` }} />
            </div>
            <footer>
              <span>
                <Icon name="calendar" size={14} /> Due {list[0].due}
              </span>
              <span>
                <Icon name="camera" size={14} /> {list[0].deliverables}
              </span>
            </footer>
          </div>
        </div>
      )}

      {tab !== "active" && (
        <div className="task-list" style={{ marginTop: 8 }}>
          {list.map((item) => (
            <div key={item.id}>
              <span className="task-icon">
                <Icon name="briefcase" />
              </span>
              <p>
                <strong>{item.title}</strong>
                <small>
                  {item.brand} · {item.creatorsConfirmed}
                </small>
              </p>
              <Icon name="chevron" />
            </div>
          ))}
          {!list.length && (
            <div>
              <span className="task-icon yellow">
                <Icon name="clock" />
              </span>
              <p>
                <strong>Nothing here yet</strong>
                <small>Book a creator to see activity</small>
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "active" && (
        <>
          <h3 className="small-title">Needs attention</h3>
          <div className="task-list">
            {campaigns
              .filter((c) => c.needsAttention)
              .map((c, i) => (
                <div key={c.id}>
                  <span className={`task-icon ${i ? "yellow" : ""}`}>
                    <Icon name={i ? "clock" : "camera"} />
                  </span>
                  <p>
                    <strong>{c.needsAttention}</strong>
                    <small>{c.title}</small>
                  </p>
                  <Icon name="chevron" />
                </div>
              ))}
            {bookings.slice(0, 3).map((b) => (
              <div key={b.id}>
                <span className="task-icon">
                  <Icon name="message" />
                </span>
                <p>
                  <strong>Awaiting response · #{b.id}</strong>
                  <small>
                    {b.deliverable} · {formatInr(b.price)}
                  </small>
                </p>
                <Icon name="chevron" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
