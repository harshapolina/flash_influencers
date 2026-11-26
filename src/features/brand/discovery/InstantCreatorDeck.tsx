import { useState } from "react";
import { creators } from "../../../data";
import { Icon } from "../../../lib/icons";
import type { Creator } from "../../../types";
import { StatusBar } from "../../../components/ui/StatusBar";

export function InstantCreatorDeck({
  onClose,
  onBrowseAll,
  onOpenChat,
  onBook,
  creators: liveCreators,
}: {
  onClose: () => void;
  onBrowseAll: () => void;
  onOpenChat: () => void;
  onBook?: (creator: Creator) => void;
  creators?: Creator[];
}) {
  const source = liveCreators?.length ? liveCreators : creators;
  const allProfiles = source.map((creator, index) => ({
    ...creator,
    distance: [2.4, 5.8, 8.1, 12.5, 18.2, 29.4, 43.8, 51.2, 76.1][index % 9],
    response: ["8 min", "12 min", "6 min", "15 min", "11 min", "18 min", "22 min", "9 min", "28 min"][
      index % 9
    ],
    reliability: [98, 96, 99, 94, 97, 95, 93, 96, 96][index % 9],
  }));
  const [radius, setRadius] = useState(25);
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestsSent, setRequestsSent] = useState(0);
  const [toast, setToast] = useState("");
  const [requestProfile, setRequestProfile] = useState<(typeof allProfiles)[number] | null>(null);
  const [requestStatus, setRequestStatus] = useState<"pending" | "accepted">("pending");
  const [requestPopupOpen, setRequestPopupOpen] = useState(false);
  const profiles = allProfiles.filter((profile) => profile.distance <= radius);
  const current = profiles[index];
  const completed = index >= profiles.length;

  const act = (action: "skip" | "request" | "details") => {
    if (!current) return;
    if (action === "details") {
      setOffset({ x: 0, y: 0 });
      setDetailsOpen(true);
      return;
    }
    const x = action === "request" ? 520 : -520;
    setOffset({ x, y: 20 });
    if (action === "request") {
      const base = source.find((creator) => creator.id === current.id) || current;
      if (onBook) {
        window.setTimeout(() => onBook(base), 220);
      } else {
        setRequestsSent((count) => count + 1);
        setRequestProfile(current);
        setRequestStatus("pending");
        setRequestPopupOpen(true);
        setToast(`Request sent to ${current.name.split(" ")[0]}`);
        window.setTimeout(() => setToast(""), 1800);
        window.setTimeout(() => setRequestStatus("accepted"), 3200);
      }
    }
    window.setTimeout(() => {
      setIndex((value) => value + 1);
      setOffset({ x: 0, y: 0 });
    }, 240);
  };

  const changeRadius = (value: number) => {
    setRadius(value);
    setIndex(0);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="instant-deck-layer">
      <div className={`instant-deck ${detailsOpen ? "detail-mode" : ""}`}>
        <StatusBar />
        {detailsOpen && current && (
          <article className="inline-creator-detail">
            <div className="inline-detail-hero">
              <img src={current.image} alt={current.name} />
              <div className="inline-detail-shade" />
              <button className="inline-detail-back" onClick={() => setDetailsOpen(false)}>
                ‹
              </button>
              <div className="inline-detail-status">
                <span>
                  <Icon name="pin" size={12} /> {current.distance} km away
                </span>
                <span>
                  <i /> Available now
                </span>
              </div>
              <div className="inline-detail-identity">
                <span>
                  <Icon name="sparkles" size={11} /> {current.match}% brand match
                </span>
                <h1>
                  {current.name}
                  <b>
                    <Icon name="check" size={9} />
                  </b>
                </h1>
                <p>
                  <Icon name="pin" size={10} /> {current.city} · {current.handle}
                </p>
                <div>
                  {current.niche.split(" · ").map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                  <span>Available today</span>
                </div>
              </div>
              <div className="inline-scroll-cue">
                <span>Scroll for full profile</span>
                <i>⌄</i>
              </div>
            </div>

            <div className="inline-detail-content">
              <div className="inline-detail-stats">
                <div>
                  <strong>{current.followers}</strong>
                  <span>Followers</span>
                </div>
                <div>
                  <strong>{current.views}</strong>
                  <span>Avg. views</span>
                </div>
                <div>
                  <strong>{current.engagement}</strong>
                  <span>Engagement</span>
                </div>
                <div>
                  <strong>{current.reliability}%</strong>
                  <span>Reliability</span>
                </div>
              </div>

              <section className="inline-fit-section">
                <span>
                  <Icon name="sparkles" size={17} />
                </span>
                <div>
                  <small>AI FIT SUMMARY</small>
                  <h2>Why {current.name.split(" ")[0]} fits your brand</h2>
                  <p>
                    Strong audience overlap with urban lifestyle buyers, consistently high content
                    quality, and pricing within your preferred campaign range.
                  </p>
                </div>
              </section>

              <section className="inline-performance">
                <header>
                  <div>
                    <small>LAST 6 POSTS</small>
                    <h2>Recent performance</h2>
                  </div>
                  <strong>
                    +18% <span>vs. average</span>
                  </strong>
                </header>
                <div className="inline-performance-bars">
                  {[58, 82, 67, 91, 76, 88].map((value, barIndex) => (
                    <div key={barIndex}>
                      <i style={{ height: `${value}%` }} />
                      <span>{barIndex + 1}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="inline-audience-section">
                <header>
                  <small>AUDIENCE SNAPSHOT</small>
                  <h2>Built for your target market</h2>
                </header>
                <div>
                  <article>
                    <span>68%</span>
                    <strong>Women</strong>
                    <small>Primary audience</small>
                  </article>
                  <article>
                    <span>24–34</span>
                    <strong>Core age</strong>
                    <small>Highest reach</small>
                  </article>
                  <article>
                    <span>61%</span>
                    <strong>Metro cities</strong>
                    <small>Top locations</small>
                  </article>
                </div>
              </section>

              <section className="inline-content-tags">
                <h2>Content and languages</h2>
                <div>
                  {[...current.niche.split(" · "), "Reels", "Stories", "English", "Hindi"].map(
                    (tag) => (
                      <span key={tag}>{tag}</span>
                    ),
                  )}
                </div>
              </section>

              <section className="inline-collab-facts">
                <div>
                  <small>STARTING FROM</small>
                  <strong>{current.price}</strong>
                  <span>per collaboration</span>
                </div>
                <div>
                  <small>AVG. RESPONSE</small>
                  <strong>{current.response}</strong>
                  <span>usually same day</span>
                </div>
              </section>

              <button
                className="inline-detail-request"
                onClick={() => {
                  setDetailsOpen(false);
                  act("request");
                }}
              >
                Send collaboration request <Icon name="arrow" size={15} />
              </button>
              <button className="inline-back-to-deck" onClick={() => setDetailsOpen(false)}>
                Back to nearby creators
              </button>
            </div>
          </article>
        )}
        <header className="instant-deck-head">
          <button onClick={onClose}>‹</button>
          <div>
            <small>INSTANT MATCHES</small>
            <strong>Nearby creators</strong>
          </div>
          <button onClick={onBrowseAll}>
            <Icon name="search" size={18} />
          </button>
        </header>

        <nav className="deck-view-switch" aria-label="Creator discovery views">
          <span className="active">For you</span>
          <button onClick={onBrowseAll}>All nearby</button>
          <button onClick={() => (requestProfile ? setRequestPopupOpen(true) : onBrowseAll())}>
            Requests
            {requestsSent > 0 && <span>{requestsSent}</span>}
          </button>
        </nav>

        <section className="deck-radius">
          <div>
            <span>
              <Icon name="pin" size={15} /> SEARCH RADIUS
            </span>
            <strong>{radius} km</strong>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={radius}
            onChange={(event) => changeRadius(Number(event.target.value))}
          />
          <footer>
            <span>
              <i /> {profiles.length - Math.min(index, profiles.length)} available nearby
            </span>
            <span>Drag to load more profiles</span>
          </footer>
        </section>

        {toast && (
          <div className="deck-toast">
            <span>
              <Icon name="check" size={12} />
            </span>
            {toast}
          </div>
        )}

        {!completed && current ? (
          <>
            <div className="swipe-deck">
              {profiles[index + 2] && <div className="swipe-card card-back-two" />}
              {profiles[index + 1] && (
                <div className="swipe-card card-back-one">
                  <img src={profiles[index + 1].image} alt="" />
                </div>
              )}
              <article
                className="swipe-card active-swipe-card"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 18}deg)`,
                  transition: dragging ? "none" : "transform 220ms ease",
                }}
                onPointerDown={(event) => {
                  setDragging(true);
                  setStart({ x: event.clientX, y: event.clientY });
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragging) return;
                  setOffset({ x: event.clientX - start.x, y: event.clientY - start.y });
                }}
                onPointerUp={() => {
                  setDragging(false);
                  if (offset.x > 75) act("request");
                  else if (offset.x < -75) act("skip");
                  else if (offset.y < -70) act("details");
                  else setOffset({ x: 0, y: 0 });
                }}
              >
                <img src={current.image} alt={current.name} draggable={false} />
                <div className="swipe-card-shade" />
                <div className="swipe-card-top">
                  <span className="creator-distance">
                    <Icon name="pin" size={12} /> {current.distance} km away
                  </span>
                  <span className="creator-online">
                    <i /> Available now
                  </span>
                </div>
                <div className={`swipe-stamp request ${offset.x > 30 ? "visible" : ""}`}>
                  SEND REQUEST
                </div>
                <div className={`swipe-stamp skip ${offset.x < -30 ? "visible" : ""}`}>SKIP</div>
                <div className={`swipe-stamp details ${offset.y < -30 ? "visible" : ""}`}>
                  VIEW DETAILS
                </div>
                <div className="swipe-profile-copy">
                  <span className="swipe-match">
                    <Icon name="sparkles" size={11} /> {current.match}% brand match
                  </span>
                  <h2>
                    {current.name}
                    <b>
                      <Icon name="check" size={9} />
                    </b>
                  </h2>
                  <p>
                    <Icon name="pin" size={10} /> {current.city} · {current.handle}
                  </p>
                  <div className="swipe-creator-tags">
                    {current.niche.split(" · ").map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                    <span>Available today</span>
                  </div>
                  <div className="swipe-stats">
                    <div>
                      <strong>{current.followers}</strong>
                      <span>Followers</span>
                    </div>
                    <div>
                      <strong>{current.views}</strong>
                      <span>Avg. views</span>
                    </div>
                    <div>
                      <strong>{current.engagement}</strong>
                      <span>Engagement</span>
                    </div>
                  </div>
                  <footer>
                    <div>
                      <small>STARTING FROM</small>
                      <strong>{current.price}</strong>
                    </div>
                    <div>
                      <small>AVG. RESPONSE</small>
                      <strong>{current.response}</strong>
                    </div>
                  </footer>
                </div>
              </article>
            </div>
          </>
        ) : (
          <div className="deck-complete">
            <div className="deck-complete-visual">
              <span>
                <Icon name="check" size={27} />
              </span>
              <i />
              <i />
            </div>
            <small>YOU’RE ALL CAUGHT UP</small>
            <h2>
              You viewed everyone
              <br />
              within {radius} km.
            </h2>
            <p>
              {requestsSent} collaboration {requestsSent === 1 ? "request was" : "requests were"}{" "}
              sent.
            </p>
            <div className="complete-radius-control">
              <header>
                <span>INCREASE RADIUS</span>
                <strong>{radius} km</strong>
              </header>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
              />
              <footer>
                <span>5 km</span>
                <span>100 km</span>
              </footer>
            </div>
            <button
              className="load-more-profiles"
              onClick={() => {
                setRadius(Math.min(100, radius + 25));
                setIndex(0);
              }}
            >
              Load more profiles <Icon name="arrow" size={15} />
            </button>
            <button className="browse-all-creators" onClick={onBrowseAll}>
              Browse all creators
            </button>
          </div>
        )}

        {requestProfile && requestPopupOpen && (
          <div className="request-status-layer">
            <section className={`request-status-popup ${requestStatus}`}>
              <button className="request-popup-close" onClick={() => setRequestPopupOpen(false)}>
                <Icon name="close" size={15} />
              </button>
              <div className="request-popup-person">
                <img src={requestProfile.image} alt={requestProfile.name} />
                <span>
                  <Icon name={requestStatus === "accepted" ? "check" : "clock"} size={18} />
                </span>
              </div>
              <small>{requestStatus === "accepted" ? "REQUEST ACCEPTED" : "REQUEST SENT"}</small>
              <h2>
                {requestStatus === "accepted"
                  ? `${requestProfile.name.split(" ")[0]} accepted your request.`
                  : `Your request is with ${requestProfile.name.split(" ")[0]}.`}
              </h2>
              <p>
                {requestStatus === "accepted"
                  ? "You can now chat, share the brief, and align on campaign details."
                  : "We’ll notify you when they respond. Chat stays private and locked until they accept."}
              </p>
              <div className="request-progress">
                <div className="done">
                  <span>
                    <Icon name="check" size={10} />
                  </span>
                  <small>Sent</small>
                </div>
                <i className={requestStatus === "accepted" ? "done" : ""} />
                <div className={requestStatus === "accepted" ? "done" : "waiting"}>
                  <span>
                    <Icon name={requestStatus === "accepted" ? "check" : "clock"} size={10} />
                  </span>
                  <small>{requestStatus === "accepted" ? "Accepted" : "Waiting"}</small>
                </div>
                <i className={requestStatus === "accepted" ? "done" : ""} />
                <div className={requestStatus === "accepted" ? "done" : "locked"}>
                  <span>
                    <Icon name="message" size={10} />
                  </span>
                  <small>Chat</small>
                </div>
              </div>
              <button
                className="request-chat-button"
                disabled={requestStatus !== "accepted"}
                onClick={onOpenChat}
              >
                <Icon name={requestStatus === "accepted" ? "message" : "shield"} size={15} />
                {requestStatus === "accepted" ? "Start chatting" : "Chat unlocks after acceptance"}
              </button>
              <button className="request-keep-swiping" onClick={() => setRequestPopupOpen(false)}>
                Keep swiping
              </button>
              {requestStatus === "pending" && (
                <small className="request-demo-note">
                  Creator response preview updates shortly
                </small>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

