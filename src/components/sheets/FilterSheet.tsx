import { useState } from "react";
import { Icon } from "../../lib/icons";
import type { ExploreFilters } from "../../types";

const CATEGORIES: { id: ExploreFilters["category"]; label: string }[] = [
  { id: "all", label: "All creators" },
  { id: "influencer", label: "Influencer" },
  { id: "ugc", label: "UGC creator" },
  { id: "affiliate", label: "Affiliate" },
];

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "All"];

export function FilterSheet({
  filters,
  resultCount,
  onApply,
  onClose,
}: {
  filters: ExploreFilters;
  resultCount: number;
  onApply: (next: Partial<ExploreFilters>) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);

  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header>
          <h2>Filters</h2>
          <button type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <label>CREATOR CATEGORY</label>
        <div className="option-pills">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={draft.category === item.id ? "active" : ""}
              onClick={() => setDraft((d) => ({ ...d, category: item.id }))}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label>LOCATION</label>
        <div className="location-input">
          <Icon name="pin" />
          <span>{draft.city}, Maharashtra</span>
          <button
            type="button"
            onClick={() => {
              const idx = CITIES.indexOf(draft.city);
              const next = CITIES[(idx + 1) % CITIES.length];
              setDraft((d) => ({ ...d, city: next }));
            }}
          >
            Change
          </button>
        </div>
        <label>FOLLOWER RANGE</label>
        <div className="range-values">
          <strong>{draft.minFollowers >= 1000 ? `${draft.minFollowers / 1000}K` : draft.minFollowers}</strong>
          <strong>{draft.maxFollowers >= 500000 ? "500K+" : `${draft.maxFollowers / 1000}K`}</strong>
        </div>
        <div className="range-track">
          <span />
          <i />
          <i />
        </div>
        <label>AVAILABILITY</label>
        <button
          className="toggle-row"
          type="button"
          onClick={() => setDraft((d) => ({ ...d, availableOnly: !d.availableOnly }))}
        >
          <span>
            <strong>Available this week</strong>
            <small>Ready for new bookings</small>
          </span>
          <i className={`toggle ${draft.availableOnly ? "active" : ""}`}>
            <b />
          </i>
        </button>
        <button
          className="apply-button"
          type="button"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          Show {resultCount.toLocaleString("en-IN")} creators
        </button>
      </div>
    </div>
  );
}
