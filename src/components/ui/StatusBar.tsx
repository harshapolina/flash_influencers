import { Capacitor } from "@capacitor/core";

/**
 * Figma Make paints a fake 9:41 bar. On native, the OS status bar + MainActivity
 * insets replace that slot — skip the duplicate chrome.
 */
export function StatusBar() {
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className="status-bar">
      <strong>9:41</strong>
      <div>
        <span className="signal">▮▮▮</span>
        <span>⌁</span>
        <span className="battery" />
      </div>
    </div>
  );
}
