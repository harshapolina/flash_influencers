import { useState } from "react";
import { Icon } from "../../../lib/icons";
import type { IconName } from "../../../types";

export function CreatorSearchPreferences({
  mode,
  scheduledDay,
  onClose,
  onSearch,
}: {
  mode: "instant" | "schedule";
  scheduledDay: string;
  onClose: () => void;
  onSearch: () => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  const [purpose, setPurpose] = useState("Brand awareness");
  const [categories, setCategories] = useState(["Fashion"]);
  const [platforms, setPlatforms] = useState(["Instagram"]);
  const [creatorTypes, setCreatorTypes] = useState(["Micro"]);
  const [deliverables, setDeliverables] = useState(["Reel"]);
  const [radius, setRadius] = useState(25);
  const [budget, setBudget] = useState(50000);
  const [count, setCount] = useState(5);
  const [collaboration, setCollaboration] = useState("Paid");
  const toggle = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) =>
    setter((items) =>
      items.includes(value) ? items.filter((item) => item !== value) : [...items, value],
    );

  return (
    <div className="preference-layer" role="dialog" aria-modal="true">
      <div className="preference-sheet">
        <div className="preference-handle" />
        <header>
          <div>
            <span>OPTIONAL PREFERENCES</span>
            <h2>Find the right creators, faster.</h2>
            <p>
              {mode === "instant"
                ? "Available now · smart defaults are already applied"
                : `Scheduled for ${scheduledDay} · refine only what matters`}
            </p>
          </div>
          <button onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </header>

        <div className="preference-tabs">
          <button className={!advanced ? "active" : ""} onClick={() => setAdvanced(false)}>
            Quick <small>6 essentials</small>
          </button>
          <button className={advanced ? "active" : ""} onClick={() => setAdvanced(true)}>
            Advanced <small>More control</small>
          </button>
        </div>

        {!advanced ? (
          <div className="quick-preferences">
            <label className="preference-field">
              <span>
                CAMPAIGN PURPOSE <b>Optional</b>
              </span>
              <select value={purpose} onChange={(event) => setPurpose(event.target.value)}>
                <option>Brand awareness</option>
                <option>Product launch</option>
                <option>Drive sales</option>
                <option>Generate leads</option>
                <option>Create UGC</option>
                <option>Store visits</option>
              </select>
            </label>

            <div className="preference-field">
              <span>
                INFLUENCER CATEGORY <b>Select multiple</b>
              </span>
              <div className="compact-chips">
                {["Fashion", "Beauty", "Lifestyle", "Food", "Tech", "Fitness"].map((item) => (
                  <button
                    className={categories.includes(item) ? "active" : ""}
                    onClick={() => toggle(item, categories, setCategories)}
                    key={item}
                  >
                    {item}
                    {categories.includes(item) && <Icon name="check" size={10} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="preference-location-row">
              <label>
                <span>LOCATION</span>
                <div>
                  <Icon name="pin" size={15} />
                  <strong>Mumbai</strong>
                  <Icon name="chevron" size={12} />
                </div>
              </label>
              <label>
                <span>SEARCH RADIUS</span>
                <div>
                  <Icon name="trending" size={15} />
                  <strong>{radius} km</strong>
                </div>
              </label>
            </div>
            <div className="preference-slider radius-slider">
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
              />
              <div>
                <span>5 km</span>
                <span>100 km</span>
              </div>
            </div>

            <div className="preference-budget">
              <div>
                <span>
                  TOTAL BUDGET <b>Optional</b>
                </span>
                <strong>₹{budget.toLocaleString("en-IN")}</strong>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
              <footer>
                <span>₹10K</span>
                <span>₹5L+</span>
              </footer>
            </div>

            <div className="creator-count-row">
              <div>
                <span>NUMBER OF INFLUENCERS</span>
                <small>How many creators do you need?</small>
              </div>
              <div className="count-stepper">
                <button onClick={() => setCount(Math.max(1, count - 1))}>−</button>
                <strong>{count}</strong>
                <button onClick={() => setCount(Math.min(50, count + 1))}>+</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="advanced-preferences">
            <div className="preference-field">
              <span>
                PLATFORMS <b>Select multiple</b>
              </span>
              <div className="platform-preference-grid">
                {[
                  ["Instagram", "instagram"],
                  ["YouTube", "youtube"],
                  ["Facebook", "facebook"],
                ].map(([item, icon]) => (
                  <button
                    className={platforms.includes(item) ? "active" : ""}
                    onClick={() => toggle(item, platforms, setPlatforms)}
                    key={item}
                  >
                    <Icon name={icon as IconName} size={17} />
                    {item}
                    {platforms.includes(item) && <Icon name="check" size={10} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="preference-field">
              <span>
                CREATOR TYPE <b>Select multiple</b>
              </span>
              <div className="tier-grid">
                {[
                  ["Nano", "1K–10K"],
                  ["Micro", "10K–100K"],
                  ["Mid-tier", "100K–500K"],
                  ["Macro", "500K+"],
                ].map(([item, range]) => (
                  <button
                    className={creatorTypes.includes(item) ? "active" : ""}
                    onClick={() => toggle(item, creatorTypes, setCreatorTypes)}
                    key={item}
                  >
                    <strong>{item}</strong>
                    <small>{range}</small>
                  </button>
                ))}
              </div>
            </div>

            <label className="preference-field">
              <span>COLLABORATION TYPE</span>
              <select
                value={collaboration}
                onChange={(event) => setCollaboration(event.target.value)}
              >
                <option>Paid</option>
                <option>Barter</option>
                <option>Product exchange</option>
                <option>Affiliate commission</option>
              </select>
            </label>

            <div className="preference-field">
              <span>
                DELIVERABLES <b>Select multiple</b>
              </span>
              <div className="compact-chips">
                {["Reel", "Story", "Post", "YouTube video", "Shorts", "UGC"].map((item) => (
                  <button
                    className={deliverables.includes(item) ? "active" : ""}
                    onClick={() => toggle(item, deliverables, setDeliverables)}
                    key={item}
                  >
                    {item}
                    {deliverables.includes(item) && <Icon name="check" size={10} />}
                  </button>
                ))}
              </div>
            </div>

            <label className="preference-field">
              <span>
                ADDITIONAL REQUIREMENTS <b>Optional</b>
              </span>
              <textarea placeholder="Example: Telugu-speaking creators comfortable with store visits…" />
            </label>
          </div>
        )}

        <div className="preference-summary">
          <Icon name="sparkles" size={15} />
          <p>
            <strong>
              {categories.length || 1} niches · {radius} km · ₹{Math.round(budget / 1000)}K ·{" "}
              {count} creators
            </strong>
            <small>You can adjust filters again on the results page.</small>
          </p>
        </div>

        <footer className="preference-actions">
          <button className="smart-defaults" onClick={onSearch}>
            Use smart defaults
          </button>
          <button className="apply-preferences" onClick={onSearch}>
            Find matching creators <Icon name="arrow" size={15} />
          </button>
        </footer>
      </div>
    </div>
  );
}

