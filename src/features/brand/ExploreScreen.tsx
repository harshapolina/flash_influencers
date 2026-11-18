import { useEffect } from "react";
import { Icon } from "../../lib/icons";
import type { Creator } from "../../types";
import { StatusBar } from "../../components/ui/StatusBar";
import { useAppStore } from "../../store/AppStore";

const NICHES = ["For you", "Fashion", "UGC", "Nearby", "Available now"] as const;

export function ExploreScreen({
  creators: list,
  query,
  setQuery,
  onCreator,
  onFilter,
}: {
  creators: Creator[];
  query: string;
  setQuery: (s: string) => void;
  onCreator: (c: Creator) => void;
  onFilter: () => void;
}) {
  const { state, toggleLike, setFilters, refreshCreators } = useAppStore();

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshCreators(query);
    }, 200);
    return () => window.clearTimeout(t);
  }, [query, state.filters, refreshCreators]);
  const activeFilters =
    (state.filters.category !== "all" ? 1 : 0) +
    (state.filters.availableOnly ? 1 : 0) +
    (state.filters.city !== "All" ? 1 : 0);

  return (
    <div className="screen explore-screen">
      <StatusBar />
      <header className="explore-head">
        <div>
          <small>CREATOR MARKETPLACE</small>
          <h1>
            Discover <em>talent.</em>
          </h1>
        </div>
        <button
          className={`round-button ${state.filters.savedOnly ? "active" : ""}`}
          type="button"
          onClick={() => setFilters({ savedOnly: !state.filters.savedOnly })}
          aria-label="Show saved creators"
        >
          <Icon name="bookmark" size={19} fill={state.filters.savedOnly} />
        </button>
      </header>
      <div className="mobile-search">
        <Icon name="search" size={19} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators or niches"
        />
        <button type="button" onClick={onFilter}>
          <Icon name="filter" size={18} />
          <i>{Math.max(activeFilters, 1)}</i>
        </button>
      </div>
      <div className="pills">
        {NICHES.map((niche) => (
          <button
            key={niche}
            type="button"
            className={state.filters.niche === niche ? "active" : ""}
            onClick={() => setFilters({ niche })}
          >
            {niche}
          </button>
        ))}
      </div>
      <div className="result-line">
        <span>
          {list.length
            ? `${list.length.toLocaleString("en-IN")} creator${list.length === 1 ? "" : "s"}`
            : "No creators"}
        </span>
        <button
          type="button"
          onClick={() =>
            setFilters({
              sort:
                state.filters.sort === "match"
                  ? "followers"
                  : state.filters.sort === "followers"
                    ? "price"
                    : "match",
            })
          }
        >
          {state.filters.sort === "match"
            ? "Best match"
            : state.filters.sort === "followers"
              ? "Most followers"
              : "Lowest price"}{" "}
          <Icon name="chevron" size={12} />
        </button>
      </div>
      <div className="explore-grid">
        {list.map((c) => (
          <article className="explore-card" key={c.id}>
            <div className="explore-image" onClick={() => onCreator(c)}>
              <img src={c.image} alt={c.name} />
              <span className="match-pill">
                <Icon name="sparkles" size={10} />
                {c.match}%
              </span>
              <button
                type="button"
                className={state.likedIds.includes(c.id) ? "active" : ""}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(c.id);
                }}
              >
                <Icon name="heart" size={17} fill={state.likedIds.includes(c.id)} />
              </button>
              <small>
                <i />
                {c.available ? "Available now" : "Busy this week"}
              </small>
            </div>
            <div className="explore-info" onClick={() => onCreator(c)}>
              <h3>
                {c.name}
                <b>
                  <Icon name="check" size={8} />
                </b>
              </h3>
              <p>
                <Icon name="pin" size={11} />
                {c.city} · {c.niche}
              </p>
              <div>
                <span>
                  <strong>{c.followers}</strong> followers
                </span>
                <span>
                  <strong>{c.engagement}</strong> engagement
                </span>
              </div>
              <footer>
                <span>
                  From <b>{c.price}</b>
                </span>
                <Icon name="arrow" size={15} />
              </footer>
            </div>
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <span>
            <Icon name="search" size={26} />
          </span>
          <h3>No creators found</h3>
          <p>Try another name, niche, or city.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilters({ niche: "For you", savedOnly: false, category: "all", city: "All" });
            }}
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
