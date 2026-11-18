import fs from "node:fs";

const figma = fs.readFileSync("_figma_flow_index.css", "utf8");
const patch = `
/* === Local interaction fixes === */
.invisible-next {
  inset: 90px 0 48px;
  z-index: 1;
}
.splash-flow .flow-skip {
  z-index: 6;
}
`;

// Prefer Figma CSS as source of truth, then re-apply small local patches by appending
// (Figma already has .invisible-next; our patch overrides later).
fs.writeFileSync("src/index.css", `${figma.trimEnd()}\n${patch}`);
console.log("Synced index.css from Figma + local patches", fs.statSync("src/index.css").size);
