import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./paths.js";

export function ensureDataDir(): string {
  mkdirSync(DATA_DIR, { recursive: true });
  return DATA_DIR;
}

export function readJsonFile<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const full = path.join(DATA_DIR, filename);
  if (!existsSync(full)) return fallback;
  const raw = readFileSync(full, "utf8");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw) as T;
}

export function writeJsonFile<T>(filename: string, value: T): void {
  ensureDataDir();
  const full = path.join(DATA_DIR, filename);
  const tmp = `${full}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(tmp, full);
}
