const GIS_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getNotDisplayedReason?: () => string;
          }) => void) => void;
          renderButton: (parent: HTMLElement, config: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function getGoogleClientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function openGoogleButtonFallback(
  clientId: string,
  resolve: (token: string) => void,
  reject: (error: Error) => void,
) {
  const host = document.createElement("div");
  host.className = "google-auth-host";
  host.style.cssText =
    "position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(0,0,0,.4);padding:16px;";
  const card = document.createElement("div");
  card.style.cssText =
    "width:min(340px,100%);background:#fff;border-radius:18px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.25);";
  card.innerHTML =
    "<p style='margin:0 0 14px;font:700 15px/1.3 Manrope,sans-serif;color:#191c19'>Continue with Google</p>";
  const btn = document.createElement("div");
  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  cancel.style.cssText =
    "margin-top:12px;width:100%;height:42px;border:0;border-radius:12px;background:#eef0eb;font-weight:700;";
  cancel.onclick = () => {
    host.remove();
    reject(new Error("Google sign-in cancelled"));
  };
  card.appendChild(btn);
  card.appendChild(cancel);
  host.appendChild(card);
  document.body.appendChild(host);

  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      host.remove();
      if (response.credential) resolve(response.credential);
      else reject(new Error("Google did not return a credential"));
    },
  });
  window.google!.accounts.id.renderButton(btn, {
    theme: "outline",
    size: "large",
    width: 300,
    text: "continue_with",
    shape: "pill",
  });
}

export async function requestGoogleIdToken(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error(
      "Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID (Web client ID) to .env and GOOGLE_CLIENT_ID to server/.env",
    );
  }
  await loadGoogleIdentity();
  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity Services unavailable");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (token: string) => {
      if (settled) return;
      settled = true;
      resolve(token);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (response.credential) done(response.credential);
        else fail(new Error("Google did not return a credential"));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        openGoogleButtonFallback(clientId, done, fail);
      }
    });
  });
}
