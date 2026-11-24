import { FullOnboarding } from "./features/onboarding/FullOnboarding";
import { BrandApp } from "./features/brand/BrandApp";
import { CreatorApp } from "./features/creator/CreatorApp";
import { AppStoreProvider, useAppStore } from "./store/AppStore";

function AuthGate() {
  const { state, completeOnboarding } = useAppStore();

  if (state.bootstrapping) {
    return (
      <div className="stage">
        <div className="mobile-app" style={{ display: "grid", placeItems: "center" }}>
          <p>Loading Orbitly…</p>
        </div>
      </div>
    );
  }

  if (!state.onboardingDone) {
    return (
      <div className="stage">
        <div className="mobile-app">
          <FullOnboarding onFinish={completeOnboarding} />
        </div>
      </div>
    );
  }

  if (state.role === "creator") return <CreatorApp />;
  return <BrandApp />;
}

export default function App() {
  return (
    <AppStoreProvider>
      <AuthGate />
    </AppStoreProvider>
  );
}
