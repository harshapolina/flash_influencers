import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { AppFlow } from "../../types";

type TxRow = { name: string; desc: string; amount: string; status: string };

export function CreatorEarningsScreen({
  onOpen,
  balance = 0,
}: {
  onOpen?: (flow: AppFlow) => void;
  balance?: number;
}) {
  const [year, setYear] = useState(2025);
  const [available, setAvailable] = useState(balance);
  const [earnedThisMonth, setEarnedThisMonth] = useState(0);
  const [pending, setPending] = useState(0);
  const [paidToDate, setPaidToDate] = useState(0);
  const [sixMonthTotal, setSixMonthTotal] = useState(0);
  const [chart, setChart] = useState<number[]>([35, 48, 41, 67, 58, 92]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  useEffect(() => {
    setAvailable(balance);
  }, [balance]);

  useEffect(() => {
    void api
      .earnings()
      .then((data) => {
        setAvailable(Number(data.available) || 0);
        setEarnedThisMonth(Number(data.earnedThisMonth) || 0);
        setPending(Number(data.pending) || 0);
        setPaidToDate(Number(data.paidToDate) || 0);
        setSixMonthTotal(Number(data.sixMonthTotal) || 0);
        if (Array.isArray(data.chart) && data.chart.length) setChart(data.chart);
        if (Array.isArray(data.transactions)) {
          setTransactions(
            data.transactions.slice(0, 6).map((tx: any) => ({
              name: tx.name,
              desc: tx.desc,
              amount: tx.amount,
              status: tx.status,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const formatInr = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(2).replace(/\.00$/, "")}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="screen creator-earnings-screen">
      <StatusBar />
      <header className="creator-section-head">
        <div>
          <small>FINANCES</small>
          <h1>Earnings</h1>
        </div>
        <button
          className="round-button"
          onClick={() =>
            onOpen?.({ name: "profile-section", role: "creator", title: "Earnings date range" })
          }
          aria-label="Choose earnings date range"
        >
          <Icon name="calendar" size={18} />
        </button>
      </header>
      <section className="earnings-balance">
        <span>AVAILABLE TO WITHDRAW</span>
        <strong>₹{available.toLocaleString("en-IN")}</strong>
        <p>
          <b>₹{earnedThisMonth.toLocaleString("en-IN")}</b> earned this month
        </p>
        <button onClick={() => onOpen?.({ name: "withdraw", role: "creator" })}>
          Withdraw now <Icon name="arrow" size={15} />
        </button>
        <div className="earnings-orb eo-one" />
        <div className="earnings-orb eo-two" />
      </section>
      <div className="earnings-kpis">
        <div>
          <span>
            <Icon name="clock" size={15} />
          </span>
          <p>
            <strong>{formatInr(pending)}</strong>
            <small>Pending</small>
          </p>
        </div>
        <div>
          <span>
            <Icon name="check" size={15} />
          </span>
          <p>
            <strong>{formatInr(paidToDate)}</strong>
            <small>Paid to date</small>
          </p>
        </div>
      </div>
      <section className="earnings-chart-card">
        <header>
          <div>
            <span>6 MONTH EARNINGS</span>
            <strong>{formatInr(sixMonthTotal || paidToDate)}</strong>
          </div>
          <button onClick={() => setYear((current) => (current === 2025 ? 2024 : 2025))}>
            {year} <Icon name="chevron" size={11} />
          </button>
        </header>
        <div className="earnings-chart">
          {(year === 2025 ? chart : [24, 39, 52, 46, 63, 71]).map((h, i) => (
            <div key={i}>
              <span className={i === 5 ? "active" : ""} style={{ height: `${Math.min(100, h)}%` }}>
                {i === 5 && <b>₹{Math.round((h / 100) * Math.max(paidToDate, 48000) / 1000)}K</b>}
              </span>
              <small>{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}</small>
            </div>
          ))}
        </div>
      </section>
      <div className="earnings-title">
        <strong>Recent transactions</strong>
        <button onClick={() => onOpen?.({ name: "transactions", role: "creator" })}>View all</button>
      </div>
      <div className="transaction-list">
        {(transactions.length
          ? transactions
          : [
              { name: "The Loom", desc: "Summer Edit milestone", amount: "+₹18,000", status: "Paid" },
              { name: "Nura Beauty", desc: "Monsoon campaign", amount: "+₹24,000", status: "Processing" },
              { name: "Orbitly", desc: "Platform fee", amount: "−₹1,920", status: "Fee" },
            ]
        ).map((tx, i) => (
          <button
            onClick={() =>
              onOpen?.({
                name: "profile-section",
                role: "creator",
                title: "Transaction receipt",
                context: tx.name,
              })
            }
            key={`${tx.name}-${i}`}
          >
            <span className={`tx-mark tm-${i % 3}`}>{tx.name.slice(0, 2).toUpperCase()}</span>
            <p>
              <strong>{tx.name}</strong>
              <small>{tx.desc}</small>
            </p>
            <div>
              <b className={tx.amount.includes("−") || tx.amount.includes("-") ? "neg" : ""}>
                {tx.amount}
              </b>
              <small>{tx.status}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
