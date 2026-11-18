import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const write = (p, c) => fs.writeFileSync(path.join(root, p), c);

let onboarding = read("src/features/onboarding/FullOnboarding.raw.txt");
onboarding = onboarding
  .replace(/^function FullOnboarding/, "export function FullOnboarding")
  .replace(/^function /gm, "function ");

// Add skip-to-dashboard buttons in splash + intro by string replace
onboarding = onboarding.replace(
  `<small>Tap anywhere to continue</small>
        </div>
      );
    }
    if (step === 1) {`,
  `<small>Tap anywhere to continue</small>
          <button className="flow-login" style={{ bottom: 54 }} onClick={() => onFinish(role)}>
            Skip to dashboard
          </button>
        </div>
      );
    }
    if (step === 1) {`,
);

onboarding = onboarding.replace(
  `<button className="flow-login">
              Already have an account? <b>Log in</b>
            </button>
          </div>
        </div>
      );
    }
    if (step === 2) {`,
  `<button className="flow-login">
              Already have an account? <b>Log in</b>
            </button>
            <button className="flow-login" onClick={() => onFinish(role)}>
              Skip onboarding · go to dashboard
            </button>
          </div>
        </div>
      );
    }
    if (step === 2) {`,
);

// Improve OTP: auto-advance focus
onboarding = onboarding.replace(
  `{otp.map((digit, index) => (
              <input
                key={index}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                onChange={(event) => {
                  const next = [...otp];
                  next[index] = event.target.value;
                  setOtp(next);
                }}
              />
            ))}`,
  `{otp.map((digit, index) => (
              <input
                key={index}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                data-otp={index}
                onChange={(event) => {
                  const value = event.target.value.replace(/\\D/g, "").slice(-1);
                  const next = [...otp];
                  next[index] = value;
                  setOtp(next);
                  if (value && index < 5) {
                    const el = document.querySelector(\`input[data-otp="\${index + 1}"]\`);
                    if (el instanceof HTMLInputElement) el.focus();
                  }
                }}
              />
            ))}`,
);

write(
  "src/features/onboarding/FullOnboarding.tsx",
  `import { useState } from "react";
import { brandSteps, creatorSteps, creators } from "../../data";
import { Icon } from "../../lib/icons";
import type { OnboardingRole } from "../../types";
import { StatusBar } from "../../components/ui/StatusBar";

${onboarding}
`,
);

let creator = read("src/features/creator/screens.raw.txt");
creator = creator
  .replace(/^function CreatorHomeScreen/, "export function CreatorHomeScreen")
  .replace(/^function CreatorOpportunitiesScreen/, "export function CreatorOpportunitiesScreen")
  .replace(/^function CreatorWorkScreen/, "export function CreatorWorkScreen")
  .replace(/^function CreatorEarningsScreen/, "export function CreatorEarningsScreen")
  .replace(/^function CreatorAppProfile/, "export function CreatorAppProfile")
  .replace(/^function CreatorBottomNav/, "export function CreatorBottomNav");

write(
  "src/features/creator/screens.tsx",
  `import { Icon } from "../../lib/icons";
import type { CreatorTab, IconName } from "../../types";
import { campaigns, creators } from "../../data";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";

${creator}
`,
);

let brand = read("src/features/brand/screens.raw.txt");
brand = brand
  .replace(/^function HomeScreen/, "export function HomeScreen")
  .replace(/^function SectionTitle[\s\S]*?(?=^function ExploreScreen)/m, "")
  .replace(/^function ExploreScreen/, "export function ExploreScreen")
  .replace(/^function CampaignScreen/, "export function CampaignScreen")
  .replace(/^function InboxScreen/, "export function InboxScreen")
  .replace(/^function ProfileScreen/, "export function ProfileScreen")
  .replace(/^function BottomNav/, "export function BottomNav");

write(
  "src/features/brand/screens.tsx",
  `import { Icon } from "../../lib/icons";
import type { BrandTab, Creator, IconName } from "../../types";
import { creators } from "../../data";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";

${brand}
`,
);

console.log("Assembled modules");
