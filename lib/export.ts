// JSON export. Owned by W2. Native-only modules are loaded at call time, so importing this file never crashes on web.
import { SKILLS } from "./ladders";
import type { Repo } from "./repo";
import { nextAction } from "./rules";

export type ExportFile = Record<string, unknown>;

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Builds the export object: exportedAt, workouts, plannedDays, sessions with sets, periodStarts, settings, per-skill current step and signals. */
export async function buildExport(repo: Repo, now: Date = new Date()): Promise<ExportFile> {
  await repo.init();
  const [workouts, plannedDays, sessions, periodStarts, settings] = await Promise.all([
    repo.getWorkouts(),
    repo.getPlannedDays("0000-01-01", "9999-12-31"),
    repo.getSessions(),
    repo.getPeriodStarts(),
    repo.getSettings(),
  ]);
  const today = localDate(now);
  const skills = SKILLS.map((sk) => {
    const signal = nextAction(sk.name, sessions, settings, today);
    return {
      skill: sk.name,
      currentStep: settings.currentSteps[sk.name] ?? null,
      assistKg: sk.usesAssist ? settings.assistKg[sk.name] ?? null : null,
      signal: { kind: signal.kind, message: signal.message },
    };
  });
  return {
    exportedAt: now.toISOString(),
    app: "gym-ledger",
    version: 1,
    workouts,
    plannedDays,
    sessions,
    periodStarts,
    settings,
    skills,
  };
}

/** Writes gymledger-export-YYYY-MM-DD.json and opens the share sheet (web: downloads the file). Updates settings.lastExportAt. */
export async function shareExport(repo: Repo): Promise<void> {
  const now = new Date();
  const data = await buildExport(repo, now);
  const json = JSON.stringify(data, null, 2);
  const fileName = `gymledger-export-${localDate(now)}.json`;

  const { Platform } = await import("react-native");
  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } else {
    const FileSystem = await import("expo-file-system/legacy");
    const Sharing = await import("expo-sharing");
    const uri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
    if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device");
    await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "Save Gym Ledger export", UTI: "public.json" });
  }
  await repo.saveSettings({ lastExportAt: now.toISOString() });
}
