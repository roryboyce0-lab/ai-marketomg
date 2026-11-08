import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

function findRepoRoot(): string {
  if (process.env.AI_MARKETOMG_ROOT) {
    return path.resolve(process.env.AI_MARKETOMG_ROOT);
  }

  const candidates = [
    path.resolve(here, "../../.."), // packages/core/src → repo root
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "config", "pilot.json"))) {
      return candidate;
    }
  }

  return candidates[0]!;
}

/** Monorepo root */
export const REPO_ROOT = findRepoRoot();

export const DATA_DIR = process.env.AI_MARKETOMG_DATA_DIR
  ? path.resolve(process.env.AI_MARKETOMG_DATA_DIR)
  : path.join(REPO_ROOT, "data");

export const PILOT_CONFIG_PATH = process.env.AI_MARKETOMG_PILOT_CONFIG
  ? path.resolve(process.env.AI_MARKETOMG_PILOT_CONFIG)
  : path.join(REPO_ROOT, "config", "pilot.json");
