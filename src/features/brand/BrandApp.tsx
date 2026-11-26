import { useMemo, useState } from "react";
import { CreatorDetail } from "../../components/sheets/CreatorDetail";
import { FilterSheet } from "../../components/sheets/FilterSheet";
import { BookingSheet } from "../../components/sheets/BookingSheet";
import { PrototypeFlowScreen } from "../flows";
import { api } from "../../lib/api";
import { useAppStore } from "../../store/AppStore";
import type { AppFlow, BookingType, BrandTab, Creator } from "../../types";
import { BrandHomeV2 } from "./BrandHomeV2";
import { CampaignScreen } from "./CampaignScreen";
import { ExploreScreen } from "./ExploreScreen";
import { InboxScreen } from "./InboxScreen";
import { BottomNav, ProfileScreen } from "./screens";

export function BrandApp() {
  const { state, toggleLike, filterCreators, addBooking } = useAppStore();
  const [tab, setTab] = useState<BrandTab>("Home");
  const [selected, setSelected] = useState<Creator | null>(null);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingType, setBookingType] = useState<BookingType>("scheduled");
  const [successId, setSuccessId] = useState<string | null>(null);
  const [activeFlow, setActiveFlow] = useState<AppFlow | null>(null);
  const [campaignPublished, setCampaignPublished] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const filtered = useMemo(
    () => filterCreators(query),
    [filterCreators, query, state.filters, state.likedIds, state.savedIds],
  );

  const creators = filtered.length ? filtered : state.creatorsCache;

  const go = (next: BrandTab) => {
    setTab(next);
    setSelected(null);
    setBookingOpen(false);
    setSuccessId(null);
  };

  const openFlow = (flow: AppFlow) => setActiveFlow({ ...flow, role: flow.role || "brand" });

  return (
    <div className="stage">
      <div className="mobile-app">
        {tab === "Home" && (
          <BrandHomeV2
            onExplore={() => go("Explore")}
            onCampaigns={() => go("Campaigns")}
            onProfile={() => go("Profile")}
            onInbox={() => go("Inbox")}
            onCreator={setSelected}
            onOpen={openFlow}
            onOpenFlow={openFlow}
            onBookInstant={(creator) => {
              setSelected(creator);
              setBookingType("instant");
              setSuccessId(null);
              setBookingOpen(true);
            }}
          />
        )}
        {tab === "Explore" && (
          <ExploreScreen
            creators={creators}
            query={query}
            setQuery={setQuery}
            liked={state.likedIds}
            onLike={(id) => {
              void toggleLike(id);
            }}
            onCreator={setSelected}
            onFilter={() => setFilterOpen(true)}
            onOpen={openFlow}
            onOpenFlow={openFlow}
          />
        )}
        {tab === "Campaigns" && (
          <CampaignScreen
            onOpen={openFlow}
            onOpenFlow={openFlow}
            campaignPublished={campaignPublished}
            paymentComplete={paymentComplete}
          />
        )}
        {tab === "Inbox" && <InboxScreen onOpen={openFlow} />}
        {tab === "Profile" && <ProfileScreen onOpenFlow={openFlow} />}
        <BottomNav active={tab} onChange={go} />
      </div>

      {selected && !bookingOpen && (
        <CreatorDetail
          creator={selected}
          liked={state.likedIds.includes(selected.id)}
          onLike={() => {
            void toggleLike(selected.id);
          }}
          onClose={() => setSelected(null)}
          onBook={() => {
            setBookingType("scheduled");
            setSuccessId(null);
            setBookingOpen(true);
          }}
        />
      )}
      {filterOpen && <FilterSheet onClose={() => setFilterOpen(false)} />}
      {bookingOpen && selected && (
        <BookingSheet
          creator={selected}
          successId={successId}
          bookingType={bookingType}
          onSuccess={async (payload) => {
            const booking = await addBooking({
              creatorId: selected.id,
              ...payload,
            });
            setSuccessId(booking.id);
          }}
          onClose={() => {
            const goCampaigns = Boolean(successId);
            setBookingOpen(false);
            setSuccessId(null);
            if (goCampaigns) {
              setSelected(null);
              go("Campaigns");
            }
          }}
        />
      )}

      {activeFlow && (
        <PrototypeFlowScreen
          flow={activeFlow}
          onClose={() => setActiveFlow(null)}
          balance={0}
          applicationSubmitted={false}
          campaignPublished={campaignPublished}
          paymentComplete={paymentComplete}
          notificationsRead={notificationsRead}
          onMarkNotificationsRead={() => setNotificationsRead(true)}
          onApply={() => {}}
          onPublishCampaign={(payload) => {
            void api
              .createCampaign({
                title: payload?.title || "Untitled campaign",
                deliverables: payload?.deliverables,
                type: "Instagram Reel",
                pay: "₹80,000",
              })
              .then(() => setCampaignPublished(true))
              .catch(() => setCampaignPublished(true));
          }}
          onCompletePayment={() => setPaymentComplete(true)}
          onWithdraw={() => {}}
        />
      )}
    </div>
  );
}
