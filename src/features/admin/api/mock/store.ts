import { createSeed, type MockDb } from "./seed";

/*
 * The demo database: plain objects in memory, copied to sessionStorage so a
 * page reload keeps your edits for the rest of the tab's life. Changes notify
 * subscribers so open screens refetch (see ../hooks.ts).
 */

const DB_KEY = "admin-demo-db-v4";
const SESSION_KEY = "admin-demo-session-v1";

let db: MockDb | null = null;
let latency = true;
const listeners = new Set<() => void>();

export function getDb(): MockDb {
  if (db) return db;
  try {
    const saved = sessionStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved) as MockDb;
  } catch {
    /* storage blocked: start fresh */
  }
  db ??= createSeed();
  return db;
}

/** Call after every write. */
export function commit(): void {
  try {
    sessionStorage.setItem(DB_KEY, JSON.stringify(getDb()));
  } catch {
    /* ignore quota / private mode */
  }
  listeners.forEach((fn) => fn());
}

export function subscribeDb(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Back to the seed data and signed out (tests, or a "reset demo" button). */
export function resetDb(seed: MockDb = createSeed()): MockDb {
  db = seed;
  try {
    sessionStorage.removeItem(DB_KEY);
  } catch {
    /* ignore */
  }
  writeSessionMemberId(null);
  return db;
}

/** The fake network delay; tests turn it off. */
export function setLatency(on: boolean): void {
  latency = on;
}

export function wait(ms = 180 + Math.random() * 240): Promise<void> {
  return latency ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export function readSessionMemberId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function writeSessionMemberId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}
