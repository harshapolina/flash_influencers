import fs from "node:fs";

const src = fs.readFileSync("_figma_flow_App.tsx", "utf8");

const funcs = [...src.matchAll(/^function ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
console.log("=== FUNCTIONS ===");
funcs.forEach((f, i) => console.log(`${i + 1}. ${f}`));

const brandStepsMatch = src.match(/const brandSteps = \[([\s\S]*?)\] as const/);
const creatorStepsMatch = src.match(/const creatorSteps = \[([\s\S]*?)\] as const/);

function parseSteps(block) {
  const steps = [];
  const re = /\["([^"]+)",\s*"([^"]+)"\]/g;
  let m;
  while ((m = re.exec(block))) steps.push([m[1], m[2]]);
  // multiline titles
  const re2 = /\(\s*"([^"]+)",\s*"([^"]+)",\s*\)/g;
  return steps;
}

function extractStepTitles(name) {
  const start = src.indexOf(`const ${name}`);
  const end = src.indexOf("] as const", start);
  const chunk = src.slice(start, end + 10);
  const titles = [];
  const re = /\["([^"]+)"/g;
  let m;
  while ((m = re.exec(chunk))) titles.push(m[1]);
  // also handle ["Face... with multiline - first string only already caught
  return titles;
}

console.log("\n=== BRAND ROLE STEPS ===");
extractStepTitles("brandSteps").forEach((t, i) => console.log(`${i + 1}. ${t}`));
console.log("\n=== CREATOR ROLE STEPS ===");
extractStepTitles("creatorSteps").forEach((t, i) => console.log(`${i + 1}. ${t}`));

// Common phase screens from FullOnboarding
const foStart = src.indexOf("function FullOnboarding");
const foEnd = src.indexOf("function AnimatedAccountSuccess");
const fo = src.slice(foStart, foEnd);
console.log("\n=== COMMON PHASE (from code branches) ===");
const commons = [
  [0, "Splash"],
  [1, "Intro"],
  [2, "Choose path (Brand/Creator)"],
  [3, "Create account"],
  [4, "Verify details"],
  [5, "Enter OTP"],
  [6, "Account success animation"],
];
commons.forEach(([n, label]) => console.log(`${n}. ${label} (step===${n})`));

const appStart = src.indexOf("export default function App");
const appChunk = src.slice(appStart, appStart + 2500);
console.log("\n=== APP ROUTING ===");
if (appChunk.includes("BrandHomeV2")) console.log("Brand Home -> BrandHomeV2");
if (appChunk.includes("<HomeScreen")) console.log("Brand Home ALSO references HomeScreen");
["ExploreScreen", "CampaignScreen", "InboxScreen", "ProfileScreen"].forEach((s) => {
  if (appChunk.includes(s)) console.log(`Brand tab -> ${s}`);
});
["CreatorHomeScreen", "CreatorOpportunitiesScreen", "CreatorWorkScreen", "CreatorEarningsScreen", "CreatorAppProfile"].forEach((s) => {
  if (appChunk.includes(s)) console.log(`Creator tab -> ${s}`);
});
if (appChunk.includes("CreatorDetail")) console.log("Overlay -> CreatorDetail");
if (appChunk.includes("FilterSheet")) console.log("Overlay -> FilterSheet");
if (appChunk.includes("BookingSheet")) console.log("Overlay -> BookingSheet");
