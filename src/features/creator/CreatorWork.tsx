import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { WorkItem } from "../../types";

type WorkTab = "active" | "applications" | "completed";

export function CreatorWorkScreen({ onOpenOpportunities }: { onOpenOpportunities?: () => void }) {
  const [tab, setTab] = useState<WorkTab>("active");
  const [list, setList] = useState<WorkItem[]>([]);
  const [counts, setCounts] = useState({ active: 0, applications: 0, completed: 0 });
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .myWork(tab)
      .then((data) => {
        if (!alive) return;
        setList(data.items);
        setCounts({
          active: data.counts.active || 0,
          applications: data.counts.applications || 0,
          completed: data.counts.completed || 0,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tab]);

  return (
    <div className="screen creator-work-screen">
      <StatusBar />
      <header className="creator-section-head">
        <div>
          <small>MY WORK</small>
          <h1>Campaigns</h1>
        </div>
        <button className="round-button" type="button" onClick={onOpenOpportunities}>
          <Icon name="calendar" size={18} />
        </button>
      </header>
      <div className="campaign-tabs creator-work-tabs">
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
      {tab === "active" && list[0] && (
        <section className="next-deadline">
          <div className="deadline-date">
            <strong>{list[0].due.split(" ")[0] || "—"}</strong>
            <span>{(list[0].due.split(" ")[1] || "").toUpperCase()}</span>
          </div>
          <div>
            <span>NEXT DEADLINE</span>
            <strong>{list[0].status}</strong>
            <small>
              {list[0].brand} · {list[0].title}
            </small>
          </div>
          <button type="button">
            <Icon name="chevron" size={15} />
          </button>
        </section>
      )}
      <div className="creator-work-list">
        {list.map((item, index) => (
          <article key={item.id}>
            <div className="work-card-top" style={{ background: item.color }}>
              <span>{item.brand.slice(0, 2).toUpperCase()}</span>
              <b>
                {tab === "completed" ? "DONE" : tab === "applications" ? "APPLIED" : "IN PROGRESS"}
              </b>
              <i>{index + 1}</i>
            </div>
            <div className="work-card-body">
              <span>{item.brand}</span>
              <h3>{item.title}</h3>
              <p>
                <i />
                <strong>{item.status}</strong>
                <b>{item.progress}%</b>
              </p>
              <div>
                <i style={{ width: `${item.progress}%` }} />
              </div>
              <footer>
                <span>
                  <Icon name="calendar" size={12} />
                  Due {item.due}
                </span>
                <button type="button" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                  Open campaign <Icon name="arrow" size={13} />
                </button>
              </footer>
              {openId === item.id && (
                <p>
                  {item.brand} · {item.title}. Status {item.status}, {item.progress}% complete, due {item.due}.
                </p>
              )}
            </div>
          </article>
        ))}
        {!list.length && (
          <div className="empty" style={{ padding: 40 }}>
            <h3>No campaigns</h3>
            <p>Apply to opportunities to fill this tab.</p>
            <button type="button" onClick={onOpenOpportunities}>
              Browse opportunities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
