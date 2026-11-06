import { createMockApi, resetDb, resetImportWorker, setLatency } from "../api/mock";
import { getDb, writeSessionMemberId } from "../api/mock/store";

/** Seeded demo accounts and sheikhs (api/mock/seed.ts). */
export const accounts = {
  owner: "m-owner-1",
  owner2: "m-owner-2",
  /** Admin of both sheikhs. */
  admin: "m-admin-1",
  editor: "m-editor-1",
} as const;

export const S1 = "sheikh-1";
export const S2 = "sheikh-2";

export const api = createMockApi();

/** Fresh seed data, no fake network delay, signed in as `memberId` (or signed out). */
export function resetDemo(memberId?: string): void {
  setLatency(false);
  resetImportWorker();
  resetDb();
  if (memberId) writeSessionMemberId(memberId);
}

/** Switches the signed-in account without resetting the data. */
export function signInAs(memberId: string | null): void {
  writeSessionMemberId(memberId);
}

export { getDb };
