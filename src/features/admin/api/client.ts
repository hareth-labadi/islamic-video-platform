import type { AdminApi } from "./contract";
import { createHttpApi } from "./http";
import { createMockApi } from "./mock";

/*
 * The one admin client every screen uses.
 * With NEXT_PUBLIC_API_URL set, calls go to the backend (docs/specs/admin-api.md);
 * without it the panel runs on in-memory demo data (kept for the tab's life).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const isDemo = !API_URL;

export const api: AdminApi = API_URL ? createHttpApi(API_URL) : createMockApi();

export type { AdminApi } from "./contract";
export * from "./types";
export { ApiError, isApiError } from "./errors";
