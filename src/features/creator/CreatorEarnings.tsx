import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";

const CURRENT_YEAR = String(new Date().getFullYear());

function signedAmount(amount: string) {
  const negative = /[-−]/.test(amount);
  const value = Number(String(amount).replace(/[^\d.]/g, "")) || 0;
  return negative ? -value : value;
}

function isPendingStatus(status?: string) {
  return /pending|processing/i.test(status || "");
}

function isPaidTx(tx: { amount?: string; status?: string }) {
  if (isPendingStatus(tx.status)) return false;
  return signedAmount(tx.amount || "") > 0;
}

function buildChart(txs: any[], period: string) {
  if (period === "All time") {
    const byYear = new Map<number, number>();
    for (const tx of txs) {
      if (!tx?.createdAt) continue;
      const year = new Date(tx.createdAt).getFullYear();
      const value = signedAmount(tx.amount);
      if (value <= 0) continue;
      byYear.set(year, (byYear.get(year) || 0) + value);
    }
    const years = Array.from(byYear.keys()).sort((a, b) => a - b);
    const endYear = Number(CURRENT_YEAR);
    const startYear = years.length > 0 ? Math.min(years[0], endYear - 2) : endYear - 2;
    const labels: string[] = [];
    for (let y = startYear; y <= endYear; y += 1) labels.push(String(y));
    const totals = labels.map((y) => byYear.get(Number(y)) || 0);
    const peak = Math.max(...totals, 1);
    const bars = totals.map((total) =>
      total <= 0 ? 10 : Math.max(16, Math.min(100, Math.round((total / peak) * 100))),
    );
    return {
      title: "ALL TIME EARNINGS",
      total: Math.round(totals.reduce((sum, value) => sum + value, 0)),
      labels,
      bars,
      totals,
    };
  }

  const year = Number(period) || Number(CURRENT_YEAR);
  const totals = Array.from({ length: 12 }, () => 0);
  for (const tx of txs) {
    if (!tx?.createdAt) continue;
    const when = new Date(tx.createdAt);
    if (when.getFullYear() !== year) continue;
    const value = signedAmount(tx.amount);
    if (value <= 0) continue;
    totals[when.getMonth()] += value;
  }
  const peak = Math.max(...totals, 1);
  const bars = totals.map((total) =>
    total <= 0 ? 10 : Math.max(16, Math.min(100, Math.round((total / peak) * 100))),
  );
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return {
    title: `${year} EARNINGS`,
    total: Math.round(totals.reduce((sum, value) => sum + value, 0)),
    labels,
    bars,
    totals,
  };
}

function formatMoney(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatTxDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function txBrand(tx: any) {
  return tx.brand || tx.name || "Brand";
}

function txClient(tx: any) {
  return tx.client || tx.brand || tx.name || "Client";
}

function txBusiness(tx: any) {
  return tx.business || tx.desc || "Campaign";
}

function canOpenCampaign(tx: any) {
  return Boolean(tx?.campaignId) && !/bank transfer|orbitly/i.test(tx?.name || "");
}

function EarningsLedgerPage({
  kind,
  total,
  transactions,
  onBack,
  onOpenCampaign,
}: {
  kind: "pending" | "paid";
  total: number;
  transactions: any[];
  onBack: () => void;
  onOpenCampaign?: (campaignId: string) => void;
}) {
  const isPending = kind === "pending";
  return (
    <div className="screen creator-overlay-screen earnings-ledger-screen">
      <StatusBar />
      <header className="creator-overlay-head">
        <button className="round-button" type="button" onClick={onBack} aria-label="Back">
          <Icon name="chevron" size={18} />
        </button>
        <div>
          <small>{isPending ? "IN TRANSIT" : "SETTLED"}</small>
          <h1>{isPending ? "Pending" : "Paid to date"}</h1>
        </div>
        <span className="earnings-ledger-spacer" />
      </header>

      <section className={`earnings-ledger-hero ${isPending ? "is-pending" : "is-paid"}`}>
        <span>{isPending ? "TOTAL PENDING" : "TOTAL PAID"}</span>
        <strong>{formatMoney(total)}</strong>
        <p>
          {transactions.length} {isPending ? "payment" : "payout"}
          {transactions.length === 1 ? "" : "s"}
          {isPending ? " waiting to clear" : " completed successfully"}
        </p>
      </section>

      <div className="earnings-ledger-list">
        {transactions.map((tx, i) => {
          const openable = canOpenCampaign(tx);
          const body = (
            <>
              <span className={`tx-icon ${isPending ? "tx-pending" : "tx-paid"}`}>
                <Icon
                  name={
                    tx.name === "Orbitly" || tx.name === "Bank transfer" ? "wallet" : "briefcase"
                  }
                  size={16}
                />
              </span>
              <div className="earnings-ledger-copy">
                <strong>{txBusiness(tx)}</strong>
                <small className="earnings-ledger-brand">{txBrand(tx)}</small>
                <small>
                  Client · {txClient(tx)}
                  {tx.createdAt ? ` · ${formatTxDate(tx.createdAt)}` : ""}
                </small>
                {openable && <em className="earnings-ledger-cta">View opportunity</em>}
              </div>
              <div className="earnings-ledger-meta">
                <strong>{tx.amount}</strong>
                <small className={isPending ? "status-pending" : "status-paid"}>{tx.status}</small>
                {openable && <Icon name="chevron" size={14} />}
              </div>
            </>
          );
          if (openable) {
            return (
              <button
                key={tx.id || `${kind}-${i}`}
                type="button"
                className="earnings-ledger-item is-openable"
                onClick={() => {
                  if (tx.campaignId) onOpenCampaign?.(tx.campaignId);
                }}
              >
                {body}
              </button>
            );
          }
          return (
            <article key={tx.id || `${kind}-${i}`} className="earnings-ledger-item">
              {body}
            </article>
          );
        })}
        {!transactions.length && (
          <div className="empty-inline earnings-ledger-empty">
            <h3>{isPending ? "Nothing pending" : "No paid payouts yet"}</h3>
            <p>
              {isPending
                ? "Withdrawals and in-progress payouts will show up here."
                : "Completed client payouts will appear here once settled."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CreatorEarningsScreen({
  onOpenCampaign,
}: {
  onOpenCampaign?: (campaignId: string) => void;
}) {
  const [period, setPeriod] = useState(CURRENT_YEAR);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [ledger, setLedger] = useState<"pending" | "paid" | null>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const available = data?.available ?? 0;
  const withdrawn = Boolean(data?.withdrawn);
  const allTxs: any[] = data?.transactions ?? [];

  const periods = useMemo(() => {
    const years = new Set<string>([CURRENT_YEAR, String(Number(CURRENT_YEAR) - 1)]);
    for (const tx of allTxs) {
      if (!tx?.createdAt) continue;
      years.add(String(new Date(tx.createdAt).getFullYear()));
    }
    return [...Array.from(years).sort((a, b) => Number(b) - Number(a)), "All time"];
  }, [allTxs]);

  const chart = useMemo(() => buildChart(allTxs, period), [allTxs, period]);
  const activeBar = hoveredBar ?? selectedBar;
  const tipValue = activeBar == null ? 0 : chart.totals[activeBar] || 0;

  const pendingTxs = useMemo(
    () => allTxs.filter((tx) => isPendingStatus(tx.status)),
    [allTxs],
  );
  const paidTxs = useMemo(() => allTxs.filter((tx) => isPaidTx(tx)), [allTxs]);

  const load = (opts?: { keepNotice?: boolean }) => {
    api
      .earnings()
      .then((payload) => {
        setData(payload);
        if (!opts?.keepNotice) setNotice("");
      })
      .catch(() => setNotice("Couldn’t load earnings. Try again."));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setHoveredBar(null);
    setSelectedBar(null);
  }, [period]);

  useEffect(() => {
    if (!periodOpen) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const node = periodRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [periodOpen]);

  useEffect(() => {
    if (selectedBar == null) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const node = chartRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        setSelectedBar(null);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [selectedBar]);

  const withdraw = async () => {
    const canWithdraw = !busy && !Boolean(data?.withdrawn) && (data?.available ?? 0) > 0;
    if (!canWithdraw) return;
    setBusy(true);
    setNotice("");
    try {
      await api.withdraw();
      setNotice("Withdrawal requested. Funds move to Pending.");
      load({ keepNotice: true });
    } catch {
      setNotice("Couldn’t request withdrawal. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const txs = allTxs.filter((tx: { createdAt?: string }) => {
    if (period === "All time") return true;
    if (!tx.createdAt) return false;
    return new Date(tx.createdAt).getFullYear() === Number(period);
  });
  const visibleTxs = viewAll ? txs : txs.slice(0, 4);

  if (ledger) {
    return (
      <EarningsLedgerPage
        kind={ledger}
        total={ledger === "pending" ? data?.pending ?? 0 : data?.paidToDate ?? 0}
        transactions={ledger === "pending" ? pendingTxs : paidTxs}
        onBack={() => setLedger(null)}
        onOpenCampaign={onOpenCampaign}
      />
    );
  }

  return (
    <div className="screen creator-earnings-screen">
      <StatusBar />
      <header className="creator-section-head">
        <div>
          <small>FINANCES</small>
          <h1>Earnings</h1>
        </div>
      </header>
      <section className="earnings-balance">
        <span>AVAILABLE TO WITHDRAW</span>
        <strong>{formatMoney(Number(available))}</strong>
        <p>
          <b>{formatMoney(data?.earnedThisMonth ?? 0)}</b> earned this month · {period}
        </p>
        <button type="button" onClick={() => void withdraw()} disabled={busy || withdrawn || available <= 0}>
          {withdrawn ? "Withdrawal requested" : busy ? "Processing…" : "Withdraw now"}
          <Icon name="arrow" size={15} />
        </button>
        <div className="earnings-orb eo-one" />
        <div className="earnings-orb eo-two" />
      </section>
      {notice && (
        <p className={`work-inline-notice ${/Couldn|fail/i.test(notice) ? "is-error" : ""}`}>
          {notice}
        </p>
      )}
      <div className="earnings-kpis">
        <button type="button" className="earnings-kpi-btn" onClick={() => setLedger("pending")}>
          <span>
            <Icon name="clock" size={15} />
          </span>
          <p>
            <strong>{formatMoney(data?.pending ?? 0)}</strong>
            <small>Pending</small>
          </p>
          <Icon name="chevron" size={14} />
        </button>
        <button type="button" className="earnings-kpi-btn" onClick={() => setLedger("paid")}>
          <span>
            <Icon name="check" size={15} />
          </span>
          <p>
            <strong>{formatMoney(data?.paidToDate ?? 0)}</strong>
            <small>Paid to date</small>
          </p>
          <Icon name="chevron" size={14} />
        </button>
      </div>
      <section className="earnings-chart-card">
        <header>
          <div>
            <span>{chart.title}</span>
            <strong>{formatMoney(chart.total)}</strong>
          </div>
          <div className="earnings-period-dropdown" ref={periodRef}>
            <button
              type="button"
              className="earnings-period-trigger"
              aria-label="Chart period"
              aria-expanded={periodOpen}
              onClick={() => setPeriodOpen((open) => !open)}
            >
              <span>{period}</span>
              <Icon name="chevron" size={12} />
            </button>
            {periodOpen && (
              <div className="earnings-period-menu" role="listbox">
                {periods.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="option"
                    aria-selected={period === item}
                    className={period === item ? "active" : ""}
                    onClick={() => {
                      setPeriod(item);
                      setViewAll(false);
                      setPeriodOpen(false);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
        <div
          ref={chartRef}
          className={`earnings-chart ${
            period === "All time" ? "earnings-chart-years" : "earnings-chart-months"
          }`}
        >
          {chart.bars.map((h: number, i: number) => {
            const amount = chart.totals[i] || 0;
            const isActive = activeBar === i;
            return (
              <button
                key={`${chart.labels[i]}-${i}`}
                type="button"
                className={`earnings-bar ${isActive ? "is-active" : ""} ${amount > 0 ? "has-value" : ""}`}
                aria-label={`${chart.labels[i]} ${formatMoney(amount)}`}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                onFocus={() => setHoveredBar(i)}
                onBlur={() => setHoveredBar(null)}
                onClick={() => setSelectedBar((prev) => (prev === i ? null : i))}
              >
                <span className="earnings-bar-fill" style={{ height: `${h}%` }}>
                  {isActive && (
                    <b className="earnings-bar-tip">{formatMoney(amount)}</b>
                  )}
                </span>
                <small>{chart.labels[i]}</small>
              </button>
            );
          })}
        </div>
        <p className="earnings-chart-hint">
          {activeBar != null
            ? `${chart.labels[activeBar]} · ${formatMoney(tipValue)}`
            : "Tap a bar to inspect earnings"}
        </p>
      </section>
      <div className="earnings-title">
        <strong>{viewAll ? `All transactions (${txs.length})` : "Recent transactions"}</strong>
        <button
          type="button"
          onClick={() => {
            if (!txs.length && !viewAll) {
              setNotice("No transactions to show yet.");
              return;
            }
            setViewAll((v) => !v);
          }}
        >
          {viewAll ? "Show less" : "View all"}
        </button>
      </div>
      <div className="transaction-list">
        {visibleTxs.map((tx: any, i: number) => (
          <div key={tx.id || i}>
            <span className={`tx-icon tx-${i % 3}`}>
              <Icon
                name={tx.name === "Orbitly" || tx.name === "Bank transfer" ? "wallet" : "briefcase"}
                size={16}
              />
            </span>
            <p>
              <strong>{tx.name}</strong>
              <small>
                {tx.desc}
                {tx.createdAt
                  ? ` · ${new Date(tx.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}`
                  : ""}
              </small>
            </p>
            <div>
              <strong>{tx.amount}</strong>
              <small>{tx.status}</small>
            </div>
          </div>
        ))}
        {!visibleTxs.length && (
          <div className="empty-inline">
            <h3>No transactions yet</h3>
            <p>Completed campaigns will show payouts here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
