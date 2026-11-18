import fs from "node:fs";

const path = "src/features/creator/screens.tsx";
let src = fs.readFileSync(path, "utf8");

const keepStart = src.indexOf("export function CreatorHomeScreen");
const opp = src.indexOf("export function CreatorOpportunitiesScreen");
const profile = src.indexOf("export function CreatorAppProfile");
const nav = src.indexOf("export function CreatorBottomNav");

if (keepStart < 0 || opp < 0 || profile < 0 || nav < 0) {
  throw new Error("markers missing");
}

const home = src.slice(keepStart, opp);
const profileBlock = src.slice(profile, nav);
const navBlock = src.slice(nav);

const header = `import { Icon } from "../../lib/icons";
import type { CreatorTab, IconName } from "../../types";
import { campaigns, creators } from "../../data";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { useAppStore } from "../../store/AppStore";

`;

fs.writeFileSync(path, header + home + profileBlock + navBlock);
console.log("trimmed creator screens");
