import { useState } from "react";
import type { CreatorTab } from "../../types";
import { CreatorOpportunitiesScreen } from "./CreatorOpportunities";
import { CreatorWorkScreen } from "./CreatorWork";
import { CreatorEarningsScreen } from "./CreatorEarnings";
import { CreatorNotifications } from "./CreatorNotifications";
import { CreatorInbox } from "./CreatorInbox";
import { CreatorChat } from "./CreatorChat";
import { InstantBookingPopup } from "./InstantBookingPopup";
import {
  CreatorProfilePage,
  type CreatorProfilePageId,
} from "./CreatorProfilePages";
import {
  CreatorAppProfile,
  CreatorBottomNav,
  CreatorHomeScreen,
} from "./screens";

type Overlay =
  | { kind: "notifications" }
  | { kind: "inbox" }
  | { kind: "chat"; threadId: string }
  | { kind: "profile-page"; page: CreatorProfilePageId }
  | null;

export function CreatorApp() {
  const [tab, setTab] = useState<CreatorTab>("Home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);

  const openChat = (threadId: string) => setOverlay({ kind: "chat", threadId });
  const openCampaign = (campaignId: string) => {
    setOpenCampaignId(campaignId);
    setOverlay(null);
    setTab("Opportunities");
  };

  if (overlay?.kind === "chat") {
    return (
      <div className="stage">
        <div className="mobile-app creator-app">
          <CreatorChat threadId={overlay.threadId} onBack={() => setOverlay(null)} />
        </div>
      </div>
    );
  }

  if (overlay?.kind === "notifications") {
    return (
      <div className="stage">
        <div className="mobile-app creator-app">
          <CreatorNotifications
            onBack={() => setOverlay(null)}
            onOpenThread={openChat}
            onOpenWork={() => {
              setOverlay(null);
              setTab("Work");
            }}
            onOpenEarnings={() => {
              setOverlay(null);
              setTab("Earnings");
            }}
          />
        </div>
      </div>
    );
  }

  if (overlay?.kind === "inbox") {
    return (
      <div className="stage">
        <div className="mobile-app creator-app">
          <CreatorInbox onBack={() => setOverlay(null)} onOpenThread={openChat} />
        </div>
      </div>
    );
  }

  if (overlay?.kind === "profile-page") {
    return (
      <div className="stage">
        <div className="mobile-app creator-app">
          <CreatorProfilePage
            page={overlay.page}
            onBack={() => setOverlay(null)}
            onOpenEarnings={() => {
              setOverlay(null);
              setTab("Earnings");
            }}
            onOpenWork={() => {
              setOverlay(null);
              setTab("Work");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      <div className="mobile-app creator-app">
        {tab === "Home" && (
          <CreatorHomeScreen
            onExplore={() => setTab("Opportunities")}
            onOpenCampaign={openCampaign}
            onWork={() => setTab("Work")}
            onEarnings={() => setTab("Earnings")}
            onNotifications={() => setOverlay({ kind: "notifications" })}
            onInbox={() => setOverlay({ kind: "inbox" })}
            onAnalytics={() => setOverlay({ kind: "profile-page", page: "Analytics" })}
            onProfile={() => setTab("Profile")}
          />
        )}
        {tab === "Opportunities" && (
          <CreatorOpportunitiesScreen
            onChat={openChat}
            initialCampaignId={openCampaignId}
            onInitialCampaignConsumed={() => setOpenCampaignId(null)}
          />
        )}
        {tab === "Work" && (
          <CreatorWorkScreen
            onOpenOpportunities={() => setTab("Opportunities")}
            onChat={openChat}
          />
        )}
        {tab === "Earnings" && <CreatorEarningsScreen onOpenCampaign={openCampaign} />}
        {tab === "Profile" && (
          <CreatorAppProfile
            onNotifications={() => setOverlay({ kind: "notifications" })}
            onOpenPage={(page) => setOverlay({ kind: "profile-page", page })}
          />
        )}
        <CreatorBottomNav active={tab} onChange={setTab} />
        <InstantBookingPopup onOpenWork={() => setTab("Work")} />
      </div>
    </div>
  );
}
