import { useState } from "react";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../../components/ui/StatusBar";
import type { AppFlow, Creator } from "../../types";

export function ExploreScreen({
  creators: list,
  query,
  setQuery,
  liked,
  onLike,
  onCreator,
  onFilter,
  onOpen,
}: {
  creators: Creator[];
  query: string;
  setQuery: (s: string) => void;
  liked?: number[];
  onLike?: (id: number) => void;
  onCreator: (c: Creator) => void;
  onFilter: () => void;
  onOpen?: (flow: AppFlow) => void;
  onOpenFlow?: (flow: AppFlow) => void;
}) {
  const open = onOpen;
  const likedIds = liked || [];
  const like = onLike || (() => {});

  const [activePill, setActivePill] = useState("For you");
  const [sort, setSort] = useState("Best match");
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
          className="round-button"
          onClick={() => open?.({ name: "saved-creators", role: "brand" })}
          aria-label="Saved creators"
        >
          <Icon name="bookmark" size={19} />
        </button>
      </header>
      <div className="mobile-search">
        <Icon name="search" size={19} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators or niches"
        />
        <button onClick={onFilter}>
          <Icon name="filter" size={18} />
          <i>3</i>
        </button>
      </div>
      <div className="pills">
        {["For you", "Fashion", "UGC", "Nearby", "Available now"].map((item) => (
          <button
            className={activePill === item ? "active" : ""}
            onClick={() => setActivePill(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="result-line">
        <span>{list.length ? "1,248 creators" : "No creators"}</span>
        <button
          onClick={() =>
            setSort((current) =>
              current === "Best match"
                ? "Engagement"
                : current === "Engagement"
                  ? "Price low–high"
                  : "Best match",
            )
          }
        >
          {sort} <Icon name="chevron" size={12} />
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
                className={likedIds.includes(c.id) ? "active" : ""}
                onClick={(e) => {
                  e.stopPropagation();
                  like(c.id);
                }}
              >
                <Icon name="heart" size={17} fill={likedIds.includes(c.id)} />
              </button>
              <small>
                <i />
                Available now
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
          <button onClick={() => setQuery("")}>Clear search</button>
        </div>
      )}
    </div>
  );
}
