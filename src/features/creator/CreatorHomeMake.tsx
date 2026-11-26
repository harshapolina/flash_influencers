import { useEffect, useState } from "react";
import { campaigns, creators } from "../../data";
import { api } from "../../lib/api";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";
import type { AppFlow } from "../../types";

export function CreatorHomeScreen({
  onExplore,
  onWork,
  onOpen,
  balance = 84320,
  earnedThisMonth = 21400,
}: {
  onExplore: () => void;
  onWork?: () => void;
  onOpen?: (flow: AppFlow) => void;
  balance?: number;
  earnedThisMonth?: number;
}) {
  const [instantOn, setInstantOn] = useState(false);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [creatorName, setCreatorName] = useState("Aarohi Mehta");
  const [creatorImage, setCreatorImage] = useState(creators[0].image);

  useEffect(() => {
    void api
      .myCreatorProfile()
      .then(({ creator }) => {
        setInstantOn(Boolean(creator.available && (creator.availability?.sameDay ?? false)));
        setCreatorName(creator.name);
        setCreatorImage(creator.image);
      })
      .catch(() => {});
  }, []);

  const toggleInstant = async () => {
    if (availabilityBusy) return;
    const next = !instantOn;
    setInstantOn(next);
    setAvailabilityBusy(true);
    try {
      await api.updateMyAvailability({ available: next, sameDay: next });
    } catch {
      setInstantOn(!next);
    } finally {
      setAvailabilityBusy(false);
    }
  };

  return (
    <div className="screen creator-home-screen">
      <StatusBar />
      <header className="creator-home-head">
        <div className="creator-head-avatar">
          <img src={creatorImage} alt={creatorName} />
          <i />
        </div>
        <div>
          <small>GOOD MORNING</small>
          <strong>
            {creatorName}{" "}
            <span>
              <Icon name="check" size={8} />
            </span>
          </strong>
        </div>
        <button
          className="round-button"
          onClick={() => onOpen?.({ name: "notifications", role: "creator" })}
          aria-label="Open notifications"
        >
          <Icon name="bell" size={19} />
          <i />
        </button>
      </header>

      <section className="creator-wallet-hero">
        <div className="wallet-copy">
          <span>
            <Icon name="wallet" size={14} /> AVAILABLE BALANCE
          </span>
          <strong>₹{balance.toLocaleString("en-IN")}</strong>
          <p>
            <b>+₹{earnedThisMonth.toLocaleString("en-IN")}</b> earned this month
          </p>
          <button onClick={() => onOpen?.({ name: "withdraw", role: "creator" })}>
            Withdraw earnings <Icon name="arrow" size={14} />
          </button>
        </div>
        <div className="wallet-visual">
          <img src={creatorImage} alt="" />
          <span className="wallet-float wf-one">
            <Icon name="trending" size={11} /> +18%
          </span>
          <span className="wallet-float wf-two">
            <Icon name="check" size={10} /> Paid
          </span>
          <i className="wallet-orbit" />
        </div>
      </section>

      <div className="availability-list" style={{ margin: "0 16px 12px" }}>
        <button type="button" onClick={() => void toggleInstant()} disabled={availabilityBusy}>
          <span>
            <strong>Instant availability</strong>
            <small>{instantOn ? "Brands can book you today" : "Hidden from Available now"}</small>
          </span>
          <i className={instantOn ? "on" : ""}>
            <b />
          </i>
        </button>
      </div>

      <section className="creator-profile-strength">
        <div className="strength-ring">
          <strong>92</strong>
          <small>%</small>
        </div>
        <div>
          <span>PROFILE STRENGTH</span>
          <strong>Your profile stands out</strong>
          <small>Add one more portfolio sample to reach 100%.</small>
        </div>
        <button
          onClick={() =>
            onOpen?.({ name: "profile-section", role: "creator", title: "Edit profile" })
          }
          aria-label="Improve profile"
        >
          <Icon name="chevron" size={15} />
        </button>
      </section>

      <div className="creator-kpis">
        <button onClick={onWork}>
          <span className="kpi-icon lime">
            <Icon name="briefcase" size={16} />
          </span>
          <strong>4</strong>
          <small>Active work</small>
        </button>
        <button onClick={onExplore}>
          <span className="kpi-icon purple">
            <Icon name="search" size={16} />
          </span>
          <strong>18</strong>
          <small>New matches</small>
        </button>
        <button onClick={() => onOpen?.({ name: "creator-analytics", role: "creator" })}>
          <span className="kpi-icon peach">
            <Icon name="trending" size={16} />
          </span>
          <strong>6.8%</strong>
          <small>Engagement</small>
        </button>
      </div>

      <SectionTitle title="Matched for you" action="See all" onClick={onExplore} />
      <div className="opportunity-carousel">
        {campaigns.map((campaign, index) => (
          <button
            className={`opportunity-tile ot-${index}`}
            onClick={onExplore}
            key={campaign.title}
          >
            <div className="opportunity-tile-top">
              <span className="brand-glyph">{campaign.icon}</span>
              <span className="match-score">
                <Icon name="sparkles" size={10} />
                {96 - index * 3}% match
              </span>
            </div>
            <div className="opportunity-art">
              {index === 0 ? (
                <img
                  src="https://images.unsplash.com/photo-1695408247109-3bf125ad0538?crop=faces&fit=crop&w=500&h=360&q=85"
                  alt="Creator campaign"
                />
              ) : (
                <>
                  <i />
                  <i />
                  <strong>{campaign.icon}</strong>
                </>
              )}
            </div>
            <div className="opportunity-tile-copy">
              <small>{campaign.brand}</small>
              <strong>{campaign.title}</strong>
              <span>{campaign.type}</span>
              <footer>
                <b>{campaign.pay}</b>
                <i>
                  <Icon name="arrow" size={13} />
                </i>
              </footer>
            </div>
          </button>
        ))}
      </div>

      <SectionTitle title="Active campaign" action="View work" onClick={onWork} />
      <section
        className="creator-active-work"
        onClick={() => onOpen?.({ name: "creator-campaign", role: "creator" })}
      >
        <div className="active-work-brand">TL</div>
        <div className="active-work-copy">
          <span>THE LOOM · SUMMER EDIT</span>
          <strong>Final reel due tomorrow</strong>
          <div className="work-progress">
            <i />
          </div>
          <small>3 of 4 milestones complete</small>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onOpen?.({ name: "creator-campaign", role: "creator" });
          }}
          aria-label="Open active campaign"
        >
          <Icon name="chevron" size={15} />
        </button>
      </section>

      <SectionTitle
        title="This month"
        action="Analytics"
        onClick={() => onOpen?.({ name: "creator-analytics", role: "creator" })}
      />
      <section
        className="creator-performance-card"
        onClick={() => onOpen?.({ name: "creator-analytics", role: "creator" })}
      >
        <div>
          <span>CONTENT REACH</span>
          <strong>1.84M</strong>
          <small>
            <b>+24%</b> vs last month
          </small>
        </div>
        <div className="creator-mini-chart">
          {[32, 48, 40, 66, 52, 81, 74, 92].map((height, index) => (
            <i
              style={{ height: `${height}%` }}
              className={index === 7 ? "active" : ""}
              key={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
