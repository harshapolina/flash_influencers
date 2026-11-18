import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");

const dirs = [
  "src/lib",
  "src/components/ui",
  "src/components/sheets",
  "src/features/onboarding",
  "src/features/brand",
  "src/features/creator",
  "src/store",
];
for (const dir of dirs) fs.mkdirSync(path.join(root, dir), { recursive: true });

function sliceBetween(startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not slice ${startMarker} -> ${endMarker}`);
  }
  return src.slice(start, end).trimEnd();
}

function sliceFrom(startMarker) {
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing ${startMarker}`);
  return src.slice(start).trimEnd();
}

const iconPaths = sliceBetween("const iconPaths", "function Icon(").replace(
  "Record<IconName, React.ReactNode>",
  "Record<IconName, ReactNode>",
);

fs.writeFileSync(
  path.join(root, "src/lib/iconPaths.tsx"),
  `import type { ReactNode } from "react";
import type { IconName } from "../types";

${iconPaths}

export { iconPaths };
`,
);

const onboarding = sliceBetween(
  "function FullOnboarding(",
  "function StatusBar()",
);

fs.writeFileSync(
  path.join(root, "src/features/onboarding/FullOnboarding.raw.txt"),
  onboarding,
);

const creatorScreens = sliceBetween(
  "function CreatorHomeScreen(",
  "function HomeScreen(",
);

fs.writeFileSync(
  path.join(root, "src/features/creator/screens.raw.txt"),
  creatorScreens,
);

const brandScreens = sliceBetween("function HomeScreen(", "function CreatorDetail(");
fs.writeFileSync(path.join(root, "src/features/brand/screens.raw.txt"), brandScreens);

const sheets = sliceFrom("function CreatorDetail(");
fs.writeFileSync(path.join(root, "src/components/sheets/sheets.raw.txt"), sheets);

console.log("Extracted raw slices");
