import { readFileSync } from "node:fs";
import type { PilotConfig } from "./types.js";
import { PILOT_CONFIG_PATH } from "./paths.js";

let cached: PilotConfig | undefined;

export function loadPilotConfig(force = false): PilotConfig {
  if (!force && cached) return cached;
  const raw = readFileSync(PILOT_CONFIG_PATH, "utf8");
  cached = JSON.parse(raw) as PilotConfig;
  return cached;
}
