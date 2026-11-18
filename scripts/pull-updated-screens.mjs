import fs from "node:fs";

const app = fs.readFileSync("_figma_latest_App.tsx", "utf8");
const css = fs.readFileSync("_figma_latest_index.css", "utf8");

const start = app.indexOf("function BrandHomeV2(");
const end = app.indexOf("function HomeScreen({");
if (start < 0 || end < 0) throw new Error("BrandHomeV2 markers missing");

let body = app.slice(start, end).replace("function BrandHomeV2", "export function BrandHomeV2");
body = body.replaceAll("(typeof creators)[0]", "Creator");

const file = `import { useState } from "react";
import { creators } from "../../data";
import { Icon } from "../../lib/icons";
import type { Creator, IconName } from "../../types";
import { StatusBar } from "../../components/ui/StatusBar";
import { SectionTitle } from "../../components/ui/SectionTitle";

${body}`;

fs.writeFileSync("src/features/brand/BrandHomeV2.tsx", file);

const cssStart = css.indexOf(".brand-v2 {");
if (cssStart < 0) throw new Error("css missing");
const newCss = css.slice(cssStart);
const local = fs.readFileSync("src/index.css", "utf8");
if (!local.includes(".brand-v2 {")) {
  fs.writeFileSync(
    "src/index.css",
    `${local.trimEnd()}\n\n/* === Updated BrandHomeV2 from Figma Make === */\n${newCss}`,
  );
}

// Keep only Home/Profile/BottomNav in screens.tsx — drop any leftover old home if still present
let screens = fs.readFileSync("src/features/brand/screens.tsx", "utf8");
const homeStart = screens.indexOf("export function HomeScreen");
const profileStart = screens.indexOf("export function ProfileScreen");
const bottomStart = screens.indexOf("export function BottomNav");
if (homeStart >= 0 && profileStart > homeStart) {
  const header = screens.slice(0, homeStart);
  screens = `${header}${screens.slice(profileStart)}`;
  fs.writeFileSync("src/features/brand/screens.tsx", screens);
}

console.log("Updated BrandHomeV2 + CSS. Old HomeScreen removed from screens.tsx");
