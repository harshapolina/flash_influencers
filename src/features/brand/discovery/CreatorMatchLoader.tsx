import { useEffect, useState } from "react";
import { creators } from "../../../data";
import { Icon } from "../../../lib/icons";
import { StatusBar } from "../../../components/ui/StatusBar";

export function CreatorMatchLoader({
  stage,
  mode,
  scheduledDay,
  onClose,
  onResults,
}: {
  stage: number;
  mode: "instant" | "schedule";
  scheduledDay: string;
  onClose: () => void;
  onResults: () => void;
}) {
  const searchRadii = [100, 200, 300, 500, 750, 1000];
  const [radiusIndex, setRadiusIndex] = useState(0);
  const isSearching = stage < 4;
  const steps = [
    ["Understanding your request", "Reading your brand, audience, location and budget"],
    ["Curating creator profiles", "Scanning verified profiles across your preferred niches"],
    [
      mode === "instant" ? "Checking live availability" : `Checking ${scheduledDay} availability`,
      mode === "instant"
        ? "Confirming creators who can respond right now"
        : "Comparing creator calendars and campaign capacity",
    ],
    ["Ranking your best matches", "Balancing audience fit, engagement, pricing and reliability"],
    ["Your matches are ready", "24 creators fit this request"],
  ];
  const progress = ((stage + 1) / steps.length) * 100;

  useEffect(() => {
    if (!isSearching) return;
    setRadiusIndex(0);
    const radiusTimer = window.setInterval(
      () => setRadiusIndex((current) => (current + 1) % searchRadii.length),
      620,
    );
    return () => window.clearInterval(radiusTimer);
  }, [isSearching, searchRadii.length]);

  return (
    <div className="match-loader-layer" role="dialog" aria-modal="true" aria-live="polite">
      <div className={`match-loader-card stage-${stage}`}>
        <header>
          <div>
            <span>ORBITLY MATCHING</span>
            <strong>{mode === "instant" ? "Available now" : `Scheduled · ${scheduledDay}`}</strong>
          </div>
          <button onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </header>

        <div className="match-progress">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="match-step-count">STEP {Math.min(stage + 1, 5)} OF 5</div>

        {stage < 4 ? (
          <>
            <div className="matching-visual matching-map">
              <svg className="matching-map-art" viewBox="0 0 360 250" aria-hidden="true">
                <path className="match-map-block block-a" d="M-12 14 96-8l41 73-56 58-93-31Z" />
                <path className="match-map-block block-b" d="m139-18 106 8 30 65-57 63-91-44Z" />
                <path className="match-map-block block-c" d="m277-12 97 12v103l-76 29-53-67Z" />
                <path className="match-map-block block-d" d="m-20 126 96-25 63 50-19 110H-20Z" />
                <path className="match-map-block block-e" d="m147 112 82-21 66 62-20 108-135 4Z" />
                <path className="match-map-block block-f" d="m301 123 75-33v176h-88l-18-91Z" />
                <path
                  className="match-map-road main"
                  d="M-18 221C64 177 92 202 159 158S276 150 378 67"
                />
                <path className="match-map-road" d="M32-15c27 62 67 91 128 111s109 76 132 170" />
                <path className="match-map-road" d="M-10 76c88 30 129 20 190-12S288 31 372 49" />
                <path
                  className="match-map-road minor"
                  d="M76 251c15-76 44-112 95-144S253 38 263-11"
                />
                <path
                  className="match-map-route"
                  d="M38 219c50-26 76-13 111-49 29-30 52-24 77-42 27-20 43-44 88-69"
                />
                <circle className="match-map-route-head" r="3.5">
                  <animateMotion
                    dur="3.8s"
                    repeatCount="indefinite"
                    path="M38 219c50-26 76-13 111-49 29-30 52-24 77-42 27-20 43-44 88-69"
                  />
                </circle>
              </svg>

              <div className="matching-radius-label" key={searchRadii[radiusIndex]}>
                <span>AREA SCANNED</span>
                <strong>
                  {searchRadii[radiusIndex] < 1000 ? `${searchRadii[radiusIndex]} m` : "1 km"}
                </strong>
              </div>

              <div className="matching-search-radius" key={`radius-${searchRadii[radiusIndex]}`}>
                <i />
                <i />
                <i />
              </div>
              <div className="matching-map-sweep" />

              <div className="matching-core matching-you">
                <Icon name="pin" size={19} />
                <i />
                <small>You</small>
              </div>
              {creators.slice(0, 4).map((creator, index) => (
                <div className={`matching-face map-person mp-${index + 1}`} key={creator.id}>
                  <img src={creator.image} alt={creator.name} />
                  <span>
                    <i />
                    <b>{creator.name.split(" ")[0]}</b>
                    <small>
                      {index === 0 ? "120m" : index === 1 ? "240m" : index === 2 ? "410m" : "680m"}
                    </small>
                  </span>
                </div>
              ))}
            </div>
            <div className="matching-copy">
              <h2>{steps[stage][0]}</h2>
              <p>{steps[stage][1]}</p>
            </div>
            <div className="matching-checklist">
              {steps.slice(0, 4).map(([label], index) => (
                <div
                  className={index < stage ? "done" : index === stage ? "working" : ""}
                  key={label}
                >
                  <span>
                    {index < stage ? (
                      <Icon name="check" size={11} />
                    ) : index === stage ? (
                      <i />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <strong>{label}</strong>
                  <small>
                    {index < stage ? "Complete" : index === stage ? "In progress" : "Waiting"}
                  </small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="matches-ready">
            <div className="ready-match-stack">
              {creators.map((creator, index) => (
                <div className={`ready-match-card rmc-${index + 1}`} key={creator.id}>
                  <img src={creator.image} alt={creator.name} />
                  <span>{creator.match}%</span>
                </div>
              ))}
              <div className="ready-match-check">
                <Icon name="check" size={25} />
              </div>
            </div>
            <span className="ready-result-kicker">
              <Icon name="sparkles" size={12} /> MATCHING COMPLETE
            </span>
            <h2>24 creators are ready.</h2>
            <p>
              We ranked them by brand fit, audience quality, availability and budget compatibility.
            </p>
            <div className="ready-result-stats">
              <div>
                <strong>96%</strong>
                <span>Top match</span>
              </div>
              <div>
                <strong>18</strong>
                <span>Verified</span>
              </div>
              <div>
                <strong>15 min</strong>
                <span>Avg. reply</span>
              </div>
            </div>
            <button className="view-match-results" onClick={onResults}>
              View matched creators <Icon name="arrow" size={16} />
            </button>
            <button className="refine-results" onClick={onClose}>
              Refine search
            </button>
          </div>
        )}
        {stage < 4 && (
          <small className="matching-disclaimer">
            AI recommendations are estimates. You approve every invitation.
          </small>
        )}
      </div>
    </div>
  );
}

