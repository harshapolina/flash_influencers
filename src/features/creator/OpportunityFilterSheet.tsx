import { useState } from "react";
import { Icon } from "../../lib/icons";

export type OpportunityFilters = {
  location: string;
  mode: "" | "instant" | "schedule";
  minPay: number;
  sort: "recommended" | "pay" | "newest";
};

const LOCATIONS = ["All", "Mumbai", "Delhi", "Bengaluru", "Pune", "Remote"];
const PAY_STEPS = [0, 10000, 20000, 30000, 50000];

export function OpportunityFilterSheet({
  filters,
  resultCount,
  onApply,
  onClose,
}: {
  filters: OpportunityFilters;
  resultCount: number;
  onApply: (next: OpportunityFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);

  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="bottom-sheet opportunity-filter-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header>
          <h2>Filters</h2>
          <button type="button" aria-label="Close filters" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </header>

        <label>SORT BY</label>
        <div className="option-pills">
          {(
            [
              ["recommended", "Recommended"],
              ["pay", "Highest pay"],
              ["newest", "Newest"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={draft.sort === id ? "active" : ""}
              onClick={() => setDraft((d) => ({ ...d, sort: id }))}
            >
              {label}
            </button>
          ))}
        </div>

        <label>BOOKING TYPE</label>
        <div className="option-pills">
          {(
            [
              ["", "All"],
              ["instant", "Instant"],
              ["schedule", "Scheduled"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id || "all"}
              type="button"
              className={draft.mode === id ? "active" : ""}
              onClick={() => setDraft((d) => ({ ...d, mode: id }))}
            >
              {label}
            </button>
          ))}
        </div>

        <label>LOCATION</label>
        <div className="option-pills">
          {LOCATIONS.map((city) => (
            <button
              key={city}
              type="button"
              className={draft.location === city ? "active" : ""}
              onClick={() => setDraft((d) => ({ ...d, location: city }))}
            >
              {city}
            </button>
          ))}
        </div>

        <label>MINIMUM PAY</label>
        <div className="option-pills">
          {PAY_STEPS.map((pay) => (
            <button
              key={pay}
              type="button"
              className={draft.minPay === pay ? "active" : ""}
              onClick={() => setDraft((d) => ({ ...d, minPay: pay }))}
            >
              {pay === 0 ? "Any" : `₹${pay / 1000}K+`}
            </button>
          ))}
        </div>

        <button
          className="apply-button"
          type="button"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          Apply filters
        </button>
        <p className="filter-result-hint">{resultCount} opportunities in current list</p>
        <button
          type="button"
          className="filter-reset"
          onClick={() =>
            setDraft({ location: "All", mode: "", minPay: 0, sort: "recommended" })
          }
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
