import type { IconName } from "../types";
import { iconPaths } from "./iconPaths";

export type { IconName };

export function Icon({
  name,
  size = 20,
  fill = false,
}: {
  name: IconName;
  size?: number;
  fill?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}