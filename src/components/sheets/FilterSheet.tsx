import { useState } from "react";
import { Icon } from "../../lib/icons";
import { useAppStore } from "../../store/AppStore";
import type { ExploreFilters } from "../../types";

const categoryMap: Record<string, ExploreFilters["category"]> = {
  "All creators": "all",
  Influencer: "influencer",
  "UGC creator": "ugc",
  Affiliate: "affiliate",
};

const categoryLabel: Record<ExploreFilters["category"], string> = {
  all: "All creators",
  influencer: "Influencer",
  ugc: "UGC creator",
  affiliate: "Affiliate",
};

export function FilterSheet({ onClose }: { onClose: () => void }) {
  const { state, setFilters, refreshCreators } = useAppStore();
  const [category, setCategory] = useState(categoryLabel[state.filters.category] || "All creators");
  const [available, setAvailable] = useState(state.filters.availableOnly);
  const [location, setLocation] = useState(
    state.filters.city === "All" || !state.filters.city
      ? "Mumbai, Maharashtra"
      : state.filters.city.includes(",")
        ? state.filters.city
        : `${state.filters.city}, Maharashtra`,
  );

  const apply = async () => {
    const city = location.split(",")[0]?.trim() || "All";
    setFilters({
      category: categoryMap[category] || "all",
      city,
      availableOnly: available,
      niche: available ? "available now" : state.filters.niche === "available now" ? "For you" : state.filters.niche,
      minFollowers: 10000,
      maxFollowers: 500000,
    });
    await refreshCreators();
    onClose();
  };

  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header>
          <h2>Filters</h2>
          <button onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <label>CREATOR CATEGORY</label>
        <div className="option-pills">
          {["All creators", "Influencer", "UGC creator", "Affiliate"].map((item) => (
            <button
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <label>LOCATION</label>
        <div className="location-input">
          <Icon name="pin" />
          <span>{location}</span>
          <button
            onClick={() =>
              setLocation((current) =>
                current.startsWith("Mumbai") ? "Bengaluru, Karnataka" : "Mumbai, Maharashtra",
              )
            }
          >
            Change
          </button>
        </div>
        <label>FOLLOWER RANGE</label>
        <div className="range-values">
          <strong>10K</strong>
          <strong>500K+</strong>
        </div>
        <div className="range-track">
          <span />
          <i />
          <i />
        </div>
        <label>AVAILABILITY</label>
        <button className="toggle-row" onClick={() => setAvailable((current) => !current)}>
          <span>
            <strong>Available this week</strong>
            <small>Ready for new bookings</small>
          </span>
          <i className={`toggle ${available ? "active" : ""}`}>
            <b />
          </i>
        </button>
        <button className="apply-button" onClick={() => void apply()}>
          Show creators
        </button>
      </div>
    </div>
  );
}
