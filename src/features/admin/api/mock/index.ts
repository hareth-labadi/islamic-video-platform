import type { AdminApi } from "../contract";
import { auth } from "./auth";
import { playlists, series } from "./collections";
import { questions } from "./questions";
import { shorts } from "./shorts";
import { dashboard, sheikhs } from "./sheikhs";
import { team } from "./team";
import { uploads } from "./uploads";
import { videos } from "./videos";

/*
 * The demo backend: the whole AdminApi in the browser, on seed data (seed.ts)
 * kept in sessionStorage (store.ts). It applies the same permission and
 * validation rules the real backend must (guards.ts, ../../rules.ts), so it
 * doubles as an executable reference for docs/specs/admin-api.md.
 */
export function createMockApi(): AdminApi {
  return { auth, sheikhs, dashboard, videos, series, playlists, shorts, questions, team, uploads };
}

export { resetDb, setLatency } from "./store";
export { resetImportWorker } from "./import-worker";
