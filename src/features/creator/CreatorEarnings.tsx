import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";

const PERIODS = ["2025", "2024", "All time"] as const;

export function CreatorEarningsScreen() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("2025");
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .earnings()
      .then(setData)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const withdraw = async () => {
    setBusy(true);
    try {
      await api.withdraw();
      load();
    } finally {
      setBusy(false);
    }
  };

  const available = data?.available ?? 84320;
  const withdrawn = Boolean(data?.withdrawn);
  const txs = data?.transactions ?? [];
  const chart = data?.chart ?? [35, 48, 41, 67, 58, 92];

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
          type="button"
          onClick={() => {
            const idx = PERIODS.indexOf(period);
            setPeriod(PERIODS[(idx + 1) % PERIODS.length]);
          }}
        >
          <Icon name="calendar" size={18} />
        </button>
      </header>
      <section className="earnings-balance">
        <span>AVAILABLE TO WITHDRAW</span>
        <strong>₹{Number(available).toLocaleString("en-IN")}</strong>
        <p>
          <b>₹{(data?.earnedThisMonth ?? 21400).toLocaleString("en-IN")}</b> earned in June · {period}
        </p>
        <button type="button" onClick={withdraw} disabled={busy || withdrawn || available <= 0}>
          {withdrawn ? "Withdrawal requested" : busy ? "Processing…" : "Withdraw now"}{" "}
          <Icon name="arrow" size={15} />
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
            <strong>₹{(data?.pending ?? 18000).toLocaleString("en-IN")}</strong>
            <small>Pending</small>
          </p>
        </div>
        <div>
          <span>
            <Icon name="check" size={15} />
          </span>
          <p>
            <strong>₹1.42L</strong>
            <small>Paid to date</small>
          </p>
        </div>
      </div>
      <section className="earnings-chart-card">
        <header>
          <div>
            <span>6 MONTH EARNINGS</span>
            <strong>{period === "2024" ? "₹1.76L" : "₹2.14L"}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              const idx = PERIODS.indexOf(period);
              setPeriod(PERIODS[(idx + 1) % PERIODS.length]);
            }}
          >
            {period} <Icon name="chevron" size={11} />
          </button>
        </header>
        <div className="earnings-chart">
          {chart.map((h: number, i: number) => (
            <div key={i}>
              <span className={i === 5 ? "active" : ""} style={{ height: `${h}%` }}>
                {i === 5 && <b>₹48K</b>}
              </span>
              <small>{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}</small>
            </div>
          ))}
        </div>
      </section>
      <div className="earnings-title">
        <strong>Recent transactions</strong>
        <button type="button">View all</button>
      </div>
      <div className="transaction-list">
        {txs.map((tx: any, i: number) => (
          <div key={tx.id || i}>
            <span className={`tx-icon tx-${i % 3}`}>
              <Icon
                name={tx.name === "Orbitly" || tx.name === "Bank transfer" ? "wallet" : "briefcase"}
                size={16}
              />
            </span>
            <p>
              <strong>{tx.name}</strong>
              <small>{tx.desc} · 18 Jun</small>
            </p>
            <div>
              <strong>{tx.amount}</strong>
              <small>{tx.status}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
