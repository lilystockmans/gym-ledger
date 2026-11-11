// CONTRACT FILE. Android: SQLite repo (written by W2 in lib/repo.sqlite.ts).
import { SqliteRepo } from "./repo.sqlite";
import type { Repo } from "./repo";
export function createRepo(): Repo { return new SqliteRepo(); }
