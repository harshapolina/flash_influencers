import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { WorkItem } from "../../types";

type WorkTab = "active" | "applications" | "completed";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_LOOKUP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(value: Date) {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

/** Parse seed-style dues like "28 Jun" into a concrete date. */
function parseDue(due: string, reference = new Date()): Date | null {
  const match = String(due || "")
    .trim()
    .match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{2,4}))?/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTH_LOOKUP[match[2].toLowerCase()];
  if (!day || month == null) return null;
  let year = reference.getFullYear();
  if (match[3]) {
    year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  } else {
    // Prefer the nearest occurrence to today (current year, else next/prev).
    const current = startOfDay(new Date(year, month, day));
    const next = startOfDay(new Date(year + 1, month, day));
    const prev = startOfDay(new Date(year - 1, month, day));
    const ref = startOfDay(reference).getTime();
    const ranked = [current, next, prev].sort(
      (a, b) => Math.abs(a.getTime() - ref) - Math.abs(b.getTime() - ref),
    );
    return ranked[0];
  }
  return startOfDay(new Date(year, month, day));
}

function formatLongDate(value: Date) {
  return value.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function buildMonthCells(monthCursor: Date) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CreatorWorkScreen({
  onOpenOpportunities,
  onChat,
}: {
  onOpenOpportunities?: () => void;
  onChat?: (threadId: string) => void;
}) {
  const [tab, setTab] = useState<WorkTab>("active");
  const [list, setList] = useState<WorkItem[]>([]);
  const [allItems, setAllItems] = useState<WorkItem[]>([]);
  const [counts, setCounts] = useState({ active: 0, applications: 0, completed: 0 });
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDay(new Date()));
  const [calendarLoading, setCalendarLoading] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  const refresh = async (bucket = tab) => {
    const data = await api.myWork(bucket);
    setList(data.items);
    setCounts({
      active: data.counts.active || 0,
      applications: data.counts.applications || 0,
      completed: data.counts.completed || 0,
    });
  };

  const loadCalendarItems = async () => {
    setCalendarLoading(true);
    try {
      const data = await api.myWork();
      setAllItems(data.items || []);
      setCounts({
        active: data.counts.active || 0,
        applications: data.counts.applications || 0,
        completed: data.counts.completed || 0,
      });
    } catch {
      setNotice("Couldn’t load calendar deadlines. Try again.");
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    setNotice("");
    refresh(tab).catch(() => {
      if (!alive) return;
      setNotice("Couldn’t load your campaigns. Try again in a moment.");
    });
    return () => {
      alive = false;
    };
  }, [tab]);

  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, WorkItem[]>();
    for (const item of allItems) {
      const due = parseDue(item.due, today);
      if (!due) continue;
      const key = dayKey(due);
      const bucket = map.get(key) || [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return map;
  }, [allItems, today]);

  const monthCells = useMemo(() => buildMonthCells(monthCursor), [monthCursor]);

  const selectedItems = useMemo(() => {
    return deadlinesByDay.get(dayKey(selectedDay)) || [];
  }, [deadlinesByDay, selectedDay]);

  const datedItems = useMemo(() => {
    return allItems
      .map((item) => ({ item, due: parseDue(item.due, today) }))
      .filter((entry): entry is { item: WorkItem; due: Date } => Boolean(entry.due))
      .sort((a, b) => a.due.getTime() - b.due.getTime());
  }, [allItems, today]);

  const upcoming = useMemo(() => {
    const future = datedItems.filter((entry) => entry.due.getTime() >= today.getTime());
    if (future.length) return future.slice(0, 4);
    return [...datedItems].reverse().slice(0, 4);
  }, [datedItems, today]);

  const monthDeadlineCount = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    let count = 0;
    deadlinesByDay.forEach((items, key) => {
      const [y, m] = key.split("-").map(Number);
      if (y === year && m === month) count += items.length;
    });
    return count;
  }, [deadlinesByDay, monthCursor]);

  const openCalendar = async (focus?: Date) => {
    setCalendarOpen(true);
    setCalendarLoading(true);
    try {
      const data = await api.myWork();
      const items = data.items || [];
      setAllItems(items);
      setCounts({
        active: data.counts.active || 0,
        applications: data.counts.applications || 0,
        completed: data.counts.completed || 0,
      });

      const dated = items
        .map((item) => ({ item, due: parseDue(item.due, today) }))
        .filter((entry): entry is { item: WorkItem; due: Date } => Boolean(entry.due))
        .sort((a, b) => a.due.getTime() - b.due.getTime());

      let focusDay = focus ? startOfDay(focus) : null;
      if (!focusDay) {
        const future = dated.find((entry) => entry.due.getTime() >= today.getTime());
        focusDay = future?.due || dated[0]?.due || today;
      }
      setMonthCursor(new Date(focusDay.getFullYear(), focusDay.getMonth(), 1));
      setSelectedDay(focusDay);
    } catch {
      setNotice("Couldn’t load calendar deadlines. Try again.");
      setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
      setSelectedDay(today);
    } finally {
      setCalendarLoading(false);
    }
  };

  const jumpToCampaign = (item: WorkItem) => {
    setCalendarOpen(false);
    setTab(item.bucket);
    setOpenId(item.id);
    setNotice(`Opened ${item.brand} · ${item.title}`);
  };

  const accept = async (item: WorkItem) => {
    if (busyId) return;
    setBusyId(item.id);
    setNotice("");
    try {
      if (item.bookingId) {
        await api.acceptBooking(item.bookingId);
      } else {
        await api.acceptWork(item.id);
      }
      await refresh(tab);
      if (calendarOpen) await loadCalendarItems();
      setNotice(`You’re confirmed on ${item.brand}.`);
      setOpenId(item.id);
    } catch {
      setNotice("Could not confirm this booking. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (item: WorkItem) => {
    if (busyId || !item.bookingId) return;
    setBusyId(item.id);
    setNotice("");
    try {
      await api.declineBooking(item.bookingId);
      await refresh(tab);
      if (calendarOpen) await loadCalendarItems();
      setNotice(`Declined ${item.brand}. Moved to Completed.`);
      setOpenId(null);
    } catch {
      setNotice("Could not decline this booking. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (calendarOpen) {
    return (
      <div className="screen creator-work-screen work-calendar-screen">
        <StatusBar />
        <header className="creator-overlay-head">
          <button
            className="round-button"
            type="button"
            aria-label="Back to campaigns"
            onClick={() => setCalendarOpen(false)}
          >
            <Icon name="chevron" size={18} />
          </button>
          <div>
            <small>SCHEDULE</small>
            <h1>Deadlines</h1>
          </div>
          <button
            className="round-button active"
            type="button"
            aria-label="Today"
            onClick={() => {
              setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelectedDay(today);
            }}
          >
            <Icon name="calendar" size={18} />
          </button>
        </header>

        <section className="work-calendar-summary">
          <div>
            <span>THIS MONTH</span>
            <strong>{monthDeadlineCount}</strong>
            <small>deadline{monthDeadlineCount === 1 ? "" : "s"}</small>
          </div>
          <div>
            <span>UPCOMING</span>
            <strong>{upcoming.length}</strong>
            <small>next on list</small>
          </div>
        </section>

        <section className="work-calendar-card">
          <header>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setMonthCursor(
                  new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1),
                )
              }
            >
              <Icon name="chevron" size={16} />
            </button>
            <div>
              <span>DEADLINE CALENDAR</span>
              <strong>
                {MONTH_NAMES[monthCursor.getMonth()]} {monthCursor.getFullYear()}
              </strong>
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setMonthCursor(
                  new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1),
                )
              }
            >
              <Icon name="chevron" size={16} />
            </button>
          </header>

          <div className="work-calendar-weekdays">
            {WEEKDAYS.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="work-calendar-grid">
            {monthCells.map((cell, index) => {
              if (!cell) return <span key={`empty-${index}`} className="work-cal-empty" />;
              const items = deadlinesByDay.get(dayKey(cell)) || [];
              const isToday = sameDay(cell, today);
              const isSelected = sameDay(cell, selectedDay);
              const hasDeadline = items.length > 0;
              return (
                <button
                  key={dayKey(cell)}
                  type="button"
                  className={[
                    "work-cal-day",
                    isToday ? "is-today" : "",
                    isSelected ? "is-selected" : "",
                    hasDeadline ? "has-deadline" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedDay(cell)}
                >
                  <span>{cell.getDate()}</span>
                  {hasDeadline && (
                    <i style={{ background: items[0]?.color || "var(--lime)" }} />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="work-calendar-day-head">
          <strong>{formatLongDate(selectedDay)}</strong>
          <span>
            {selectedItems.length
              ? `${selectedItems.length} campaign${selectedItems.length === 1 ? "" : "s"}`
              : "No deadlines"}
          </span>
        </div>

        <div className="work-calendar-day-list">
          {calendarLoading && <p className="work-inline-notice">Loading deadlines…</p>}
          {!calendarLoading &&
            selectedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="work-calendar-event"
                onClick={() => jumpToCampaign(item)}
              >
                <span className="work-calendar-swatch" style={{ background: item.color }} />
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.brand} · {item.status}
                  </small>
                  <em>
                    Due {item.due}
                    {item.bucket === "completed"
                      ? " · Done"
                      : item.bucket === "applications"
                        ? " · Application"
                        : " · Active"}
                  </em>
                </div>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          {!calendarLoading && !selectedItems.length && (
            <div className="empty-inline work-calendar-empty">
              <h3>Clear day</h3>
              <p>No campaign deadlines fall on this date.</p>
            </div>
          )}
        </div>

        {upcoming.length > 0 && (
          <section className="work-calendar-upcoming">
            <header>
              <strong>Coming up</strong>
              <span>{upcoming.length}</span>
            </header>
            {upcoming.map(({ item, due }) => (
              <button
                key={`up-${item.id}`}
                type="button"
                onClick={() => {
                  setMonthCursor(new Date(due.getFullYear(), due.getMonth(), 1));
                  setSelectedDay(due);
                }}
              >
                <div className="deadline-date compact">
                  <strong>{due.getDate()}</strong>
                  <span>{MONTH_NAMES[due.getMonth()].slice(0, 3).toUpperCase()}</span>
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.brand} · {item.due}
                  </small>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    );
  }

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
          type="button"
          aria-label="Open deadline calendar"
          onClick={() => void openCalendar()}
        >
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
          <button
            type="button"
            className="deadline-date as-button"
            onClick={() => {
              const due = parseDue(list[0].due, today);
              void openCalendar(due || today);
            }}
          >
            <strong>{list[0].due.split(" ")[0] || "—"}</strong>
            <span>{(list[0].due.split(" ")[1] || "").toUpperCase()}</span>
          </button>
          <div>
            <span>NEXT DEADLINE</span>
            <strong>{list[0].status}</strong>
            <small>
              {list[0].brand} · {list[0].title}
            </small>
          </div>
          <button
            type="button"
            aria-label="Open next deadline in calendar"
            onClick={() => {
              const due = parseDue(list[0].due, today);
              void openCalendar(due || today);
            }}
          >
            <Icon name="calendar" size={15} />
          </button>
        </section>
      )}
      {notice && <p className="work-inline-notice">{notice}</p>}
      <div className="creator-work-list">
        {list.map((item, index) => (
          <article key={item.id}>
            <div className="work-card-top" style={{ background: item.color }}>
              <span>{item.brand.slice(0, 2).toUpperCase()}</span>
              <b>
                {tab === "completed"
                  ? "DONE"
                  : tab === "applications"
                    ? "APPLIED"
                    : item.needsAccept
                      ? "NEEDS OK"
                      : item.mode === "instant"
                        ? "INSTANT"
                        : "IN PROGRESS"}
              </b>
              <i>{index + 1}</i>
            </div>
            <div className="work-card-body">
              <span>
                {item.brand}
                {item.pay ? ` · ${item.pay}` : ""}
              </span>
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
                <button
                  type="button"
                  className="work-due-chip"
                  onClick={() => {
                    const due = parseDue(item.due, today);
                    void openCalendar(due || today);
                  }}
                >
                  <Icon name="calendar" size={12} />
                  Due {item.due}
                </button>
                <button
                  type="button"
                  className="work-open-btn"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                >
                  {openId === item.id ? "Hide details" : "Open campaign"}
                  <Icon name="arrow" size={13} />
                </button>
              </footer>
              {openId === item.id && (
                <div className="work-detail-panel">
                  <p>
                    {item.brief ||
                      `${item.brand} · ${item.title}. Status ${item.status}, ${item.progress}% complete, due ${item.due}.`}
                  </p>
                  {item.location && (
                    <small>
                      <Icon name="pin" size={12} /> {item.location}
                      {item.mode ? ` · ${item.mode === "instant" ? "Instant" : "Scheduled"}` : ""}
                    </small>
                  )}
                  <div className="work-detail-actions">
                    {item.needsAccept && (
                      <>
                        <button
                          type="button"
                          className="flow-primary"
                          disabled={busyId === item.id}
                          onClick={() => void accept(item)}
                        >
                          {busyId === item.id ? "Confirming…" : "OK to work"}
                        </button>
                        {item.bookingId && (
                          <button
                            type="button"
                            className="work-chat-btn work-decline-btn"
                            disabled={busyId === item.id}
                            onClick={() => void decline(item)}
                          >
                            Decline invite
                          </button>
                        )}
                      </>
                    )}
                    {item.threadId && (
                      <button
                        type="button"
                        className="work-chat-btn"
                        onClick={() => onChat?.(item.threadId!)}
                      >
                        <Icon name="message" size={14} /> Message brand
                      </button>
                    )}
                    <button
                      type="button"
                      className="work-chat-btn"
                      onClick={() => {
                        const due = parseDue(item.due, today);
                        void openCalendar(due || today);
                      }}
                    >
                      <Icon name="calendar" size={14} /> View on calendar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
        {!list.length && (
          <div className="empty" style={{ padding: 40 }}>
            <h3>No campaigns</h3>
            <p>When brands book you, they land here in Active.</p>
            <button type="button" onClick={onOpenOpportunities}>
              Browse opportunities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
