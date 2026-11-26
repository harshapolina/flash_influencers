import { useEffect, useState } from "react";
import { PrototypeFlowScreen } from "../flows";
import { api } from "../../lib/api";
import type { AppFlow, CreatorTab } from "../../types";
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
  const [activeFlow, setActiveFlow] = useState<AppFlow | null>(null);
  const [creatorBalance, setCreatorBalance] = useState(0);
  const [earnedThisMonth, setEarnedThisMonth] = useState(0);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const openFlow = (flow: AppFlow) => setActiveFlow({ ...flow, role: flow.role || "creator" });

  const refreshEarnings = async () => {
    try {
      const data = await api.earnings();
      setCreatorBalance(Number(data.available) || 0);
      setEarnedThisMonth(Number(data.earnedThisMonth) || 0);
    } catch {
      /* keep last known */
    }
  };

  useEffect(() => {
    void refreshEarnings();
  }, []);

  return (
    <div className="stage">
      <div className="mobile-app creator-app">
        {tab === "Home" && (
          <CreatorHomeScreen
            onExplore={() => setTab("Opportunities")}
            onWork={() => setTab("Work")}
            onOpen={openFlow}
            balance={creatorBalance}
            earnedThisMonth={earnedThisMonth}
          />
        )}
        {tab === "Opportunities" && (
          <CreatorOpportunitiesScreen
            onOpen={openFlow}
            applicationSubmitted={applicationSubmitted}
          />
        )}
        {tab === "Work" && (
          <CreatorWorkScreen onOpen={openFlow} applicationSubmitted={applicationSubmitted} />
        )}
        {tab === "Earnings" && (
          <CreatorEarningsScreen onOpen={openFlow} balance={creatorBalance} />
        )}
        {tab === "Profile" && <CreatorAppProfile onOpen={openFlow} />}
        <CreatorBottomNav active={tab} onChange={setTab} />
      </div>

      {activeFlow && (
        <PrototypeFlowScreen
          flow={activeFlow}
          onClose={() => setActiveFlow(null)}
          balance={creatorBalance}
          applicationSubmitted={applicationSubmitted}
          campaignPublished={false}
          paymentComplete={false}
          notificationsRead={notificationsRead}
          onMarkNotificationsRead={() => setNotificationsRead(true)}
          onApply={() => setApplicationSubmitted(true)}
          onPublishCampaign={() => {}}
          onCompletePayment={() => {}}
          onWithdraw={() => {
            void api
              .withdraw()
              .then((res) => {
                setCreatorBalance(Number(res.available) || 0);
              })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
