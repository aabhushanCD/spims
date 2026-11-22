import type { Db } from "mongodb";

export interface MigrationContext {
  db: Db;
  log: (message: string) => void;
}

export interface Migration {
  /** Stable, sortable id. Never rename an id after it has been applied. */
  id: string;
  description: string;
  up: (context: MigrationContext) => Promise<void>;
}

export interface MigrationRecord {
  id: string;
  description: string;
  appliedAt: Date;
  durationMs: number;
}
