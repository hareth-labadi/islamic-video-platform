"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isDemo } from "./client";
import { subscribeDb } from "./mock/store";

/*
 * Tiny data hooks: `useQuery` fetches and refetches when anything changes
 * (`invalidate()` after a write, or a mock tick); `useAction` runs a write
 * and invalidates. Enough for a panel this size, no extra library.
 */

let revision = 0;
const subscribers = new Set<() => void>();

export function invalidate(): void {
  revision++;
  subscribers.forEach((fn) => fn());
}

if (isDemo && typeof window !== "undefined") subscribeDb(invalidate);

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

interface QueryState<T> {
  key: string | null;
  id: string | null;
  data?: T;
  error?: unknown;
}

/**
 * `key` identifies what is fetched (null = don't fetch yet). With `keepPrevious`,
 * the last data stays on screen while a new key loads (filters, search).
 */
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>, opts: { keepPrevious?: boolean } = {}) {
  const rev = useSyncExternalStore(
    subscribe,
    () => revision,
    () => 0,
  );
  const id = key === null ? null : `${key}#${rev}`;
  const [state, setState] = useState<QueryState<T>>({ key: null, id: null });

  useEffect(() => {
    if (id === null) return;
    let alive = true;
    fetcher().then(
      (data) => alive && setState({ key, id, data }),
      (error) => alive && setState((s) => ({ key, id, data: s.key === key ? s.data : undefined, error })),
    );
    return () => {
      alive = false;
    };
    // The key describes the fetch; the fetcher closure is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sameKey = state.key === key;
  const data = sameKey || opts.keepPrevious ? state.data : undefined;
  return {
    data,
    error: state.id === id ? state.error : undefined,
    /** True while (re)fetching. */
    loading: id !== null && state.id !== id,
    /** True only before the first data for this key (show skeletons). */
    pending: id !== null && data === undefined && state.id !== id,
  };
}

/** Runs a write, then refreshes every query. Returns [run, busy]. */
export function useAction() {
  const [busy, setBusy] = useState(0);
  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setBusy((n) => n + 1);
    try {
      const result = await fn();
      invalidate();
      return result;
    } finally {
      setBusy((n) => n - 1);
    }
  }, []);
  return [run, busy > 0] as const;
}

let nowValue = 0;
const nowSubscribers = new Set<() => void>();
let nowTimer: ReturnType<typeof setInterval> | undefined;

function subscribeNow(fn: () => void) {
  nowSubscribers.add(fn);
  if (!nowTimer) {
    nowValue = Date.now();
    nowTimer = setInterval(() => {
      nowValue = Date.now();
      nowSubscribers.forEach((f) => f());
    }, 30_000);
  }
  return () => {
    nowSubscribers.delete(fn);
    if (nowSubscribers.size === 0 && nowTimer) {
      clearInterval(nowTimer);
      nowTimer = undefined;
    }
  };
}

function getNow(): number {
  if (!nowValue) nowValue = Date.now();
  return nowValue;
}

function getServerNow(): number {
  return 0;
}

/** Current time for relative dates, refreshed every 30 s (0 on the server). */
export function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, getServerNow);
}
