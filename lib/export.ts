// PLACEHOLDER owned by W2. W2 replaces the bodies and keeps these exported names and signatures.
import type { Repo } from "./repo";

export type ExportFile = Record<string, unknown>;

/** Builds the export object: exportedAt, workouts, plannedDays, sessions with sets, periodStarts, settings, per-skill current step and signals. */
export async function buildExport(repo: Repo, now: Date = new Date()): Promise<ExportFile> {
  void repo;
  return { exportedAt: now.toISOString() };
}

/** Writes gymledger-export-YYYY-MM-DD.json and opens the share sheet (web: downloads the file). Updates settings.lastExportAt. */
export async function shareExport(repo: Repo): Promise<void> {
  void repo;
  console.warn("shareExport is a placeholder until W2 is merged");
}
