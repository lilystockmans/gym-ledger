// CONTRACT FILE. Default (web preview, Node tests): in-memory repo. Android uses repo.impl.native.ts.
import { MemoryRepo } from "./repo.memory";
import type { Repo } from "./repo";
export function createRepo(): Repo { return new MemoryRepo(); }
