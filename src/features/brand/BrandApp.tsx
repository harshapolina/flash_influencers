import { useMemo, useState } from "react";
import { CreatorDetail } from "../../components/sheets/CreatorDetail";
import { FilterSheet } from "../../components/sheets/FilterSheet";
import { BookingSheet } from "../../components/sheets/BookingSheet";
import { useAppStore } from "../../store/AppStore";
import type { BrandTab, Creator } from "../../types";
import { BrandHomeV2 } from "./BrandHomeV2";
import { CampaignScreen } from "./CampaignScreen";
import { ExploreScreen } from "./ExploreScreen";
import { InboxScreen } from "./InboxScreen";
import { BottomNav, ProfileScreen } from "./screens";

export function BrandApp() {
  const { state, toggleLike, setFilters, filterCreators, addBooking } = useAppStore();
  const [tab, setTab] = useState<BrandTab>("Home");
  const [selected, setSelected] = useState<Creator | null>(null);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const filtered = useMemo(() => filterCreators(query), [filterCreators, query, state.filters, state.likedIds, state.savedIds]);

  const go = (next: BrandTab) => {
    setTab(next);
    setSelected(null);
    setBookingOpen(false);
    setSuccessId(null);
  };

  return (
    <div className="stage">
      <div className="mobile-app">
        {tab === "Home" && (
          <BrandHomeV2 onExplore={() => go("Explore")} onCreator={setSelected} />
        )}
        {tab === "Explore" && (
          <ExploreScreen
            creators={filtered}
            query={query}
            setQuery={setQuery}
            onCreator={setSelected}
            onFilter={() => setFilterOpen(true)}
          />
        )}
        {tab === "Campaigns" && <CampaignScreen onOpenExplore={() => go("Explore")} />}
        {tab === "Inbox" && <InboxScreen />}
        {tab === "Profile" && <ProfileScreen />}
        <BottomNav active={tab} onChange={go} />
      </div>

      {selected && !bookingOpen && (
        <CreatorDetail
          creator={selected}
          liked={state.likedIds.includes(selected.id)}
          onLike={() => toggleLike(selected.id)}
          onClose={() => setSelected(null)}
          onBook={() => {
            setSuccessId(null);
            setBookingOpen(true);
          }}
        />
      )}
      {filterOpen && (
        <FilterSheet
          filters={state.filters}
          resultCount={filtered.length}
          onApply={(next) => setFilters(next)}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {bookingOpen && selected && (
        <BookingSheet
          creator={selected}
          successId={successId}
          onSuccess={async (payload) => {
            const booking = await addBooking({
              creatorId: selected.id,
              deliverable: payload.deliverable,
              price: payload.price,
              date: payload.date,
              location: payload.location,
              mode: payload.mode,
              brief: payload.brief,
              multiplier: payload.deliverable.includes("Stories") ? 1.5 : 1,
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
    </div>
  );
}
