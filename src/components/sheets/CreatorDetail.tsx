import { useState } from "react";
import { creators } from "../../data";
import { Icon } from "../../lib/icons";
import { StatusBar } from "../ui/StatusBar";
import type { Creator } from "../../types";

export function CreatorDetail({
  creator,
  liked,
  onLike,
  onClose,
  onBook,
}: {
  creator: Creator;
  liked: boolean;
  onLike: () => void;
  onClose: () => void;
  onBook: () => void;
}) {
  const [showAllWork, setShowAllWork] = useState(false);
  return (
    <div className="detail-layer">
      <div className="detail-screen">
        <div className="detail-photo">
          <img src={creator.image} alt={creator.name} />
          <div className="detail-gradient" />
          <StatusBar />
          <button className="detail-back" onClick={onClose}>
            ‹
          </button>
          <button className={`detail-like ${liked ? "active" : ""}`} onClick={onLike}>
            <Icon name="heart" fill={liked} />
          </button>
          <div className="detail-name">
            <span>
              <Icon name="sparkles" size={11} />
              {creator.match}% BRAND MATCH
            </span>
            <h1>
              {creator.name}
              <b>
                <Icon name="check" size={9} />
              </b>
            </h1>
            <p>
              {creator.handle} · <Icon name="pin" size={12} />
              {creator.city}
            </p>
          </div>
        </div>
        <div className="detail-body">
          <div className="detail-stats">
            <div>
              <strong>{creator.followers}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{creator.engagement}</strong>
              <span>Engagement</span>
            </div>
            <div>
              <strong>{creator.views}</strong>
              <span>Avg. views</span>
            </div>
            <div>
              <strong>4.9</strong>
              <span>
                <Icon name="star" fill size={10} /> Rating
              </span>
            </div>
          </div>
          <div className="trust-line">
            <span>
              <Icon name="shield" size={15} /> ID verified
            </span>
            <span>
              <Icon name="instagram" size={15} /> Social connected
            </span>
            <span>
              <i /> Available
            </span>
          </div>
          <h3>Why Aarohi fits your brand</h3>
          <div className="ai-note">
            <Icon name="sparkles" />
            <p>
              Strong audience overlap with urban women 18–34 and <strong>2.1× higher</strong>{" "}
              engagement than your category average.
              <small>AI insight · Results are estimates</small>
            </p>
          </div>
          <div className="detail-title">
            <h3>Recent work</h3>
            <button onClick={() => setShowAllWork((current) => !current)}>
              {showAllWork ? "Show less" : "View all"}
            </button>
          </div>
          <div className="work-grid">
            {(showAllWork ? creators.concat(creators.slice(0, 2)) : creators.slice(1, 4)).map(
              (c, index) => (
                <img key={`${c.id}-${index}`} src={c.image} alt="Portfolio sample" />
              ),
            )}
          </div>
          <h3>Popular packages</h3>
          <div className="package-row">
            <div>
              <span className="package-icon">
                <Icon name="camera" />
              </span>
              <p>
                <strong>Launch moment</strong>
                <small>1 Reel + 3 Stories · 1 revision</small>
              </p>
            </div>
            <b>{creator.price}</b>
          </div>
          <div className="package-row">
            <div>
              <span className="package-icon purple">
                <Icon name="sparkles" />
              </span>
              <p>
                <strong>Brand story</strong>
                <small>2 Reels + 5 Stories · 2 revisions</small>
              </p>
            </div>
            <b>₹48K</b>
          </div>
        </div>
        <div className="detail-action">
          <div>
            <small>STARTING FROM</small>
            <strong>
              {creator.price}
              <span> / reel</span>
            </strong>
          </div>
          <button onClick={onBook}>
            Book creator <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
