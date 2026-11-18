import { useState } from "react";
import type { CreatorTab } from "../../types";
import { CreatorOpportunitiesScreen } from "./CreatorOpportunities";
import { CreatorWorkScreen } from "./CreatorWork";
import { CreatorEarningsScreen } from "./CreatorEarnings";
import {
  CreatorAppProfile,
  CreatorBottomNav,
  CreatorHomeScreen,
} from "./screens";

export function CreatorApp() {
  const [tab, setTab] = useState<CreatorTab>("Home");

  return (
    <div className="stage">
      <div className="mobile-app creator-app">
        {tab === "Home" && (
          <CreatorHomeScreen
            onExplore={() => setTab("Opportunities")}
            onWork={() => setTab("Work")}
          />
        )}
        {tab === "Opportunities" && <CreatorOpportunitiesScreen />}
        {tab === "Work" && (
          <CreatorWorkScreen onOpenOpportunities={() => setTab("Opportunities")} />
        )}
        {tab === "Earnings" && <CreatorEarningsScreen />}
        {tab === "Profile" && <CreatorAppProfile />}
        <CreatorBottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
