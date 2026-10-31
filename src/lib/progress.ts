"use client";

import { useSyncExternalStore } from "react";
import type { WatchState } from "./types";

/*
 * Watch progress saved in this browser only (no accounts, no server).
 * Shape in localStorage under KEY: { videos: { [id]: { at, done } }, last }
 */

const KEY = "watch-progress-v1";

export interface ProgressData {
  videos: Record<string, { at: number; done: boolean }>;
  last?: string;
}

const empty: ProgressData = { videos: {} };
const listeners = new Set<() => void>();
let cache: ProgressData | null = null;

function read(): ProgressData {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "null") ?? empty;
  } catch {
    cache = empty;
  }
  return cache!;
}

function write(next: ProgressData) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); progress then lasts for this visit only.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Read progress in a component. Server render and first paint see an empty record. */
export function useProgress(): ProgressData {
  return useSyncExternalStore(subscribe, read, () => empty);
}

export function saveProgress(videoId: string, seconds: number, done = false) {
  const data = read();
  write({ videos: { ...data.videos, [videoId]: { at: seconds, done } }, last: videoId });
}

export function clearProgress() {
  write(empty);
}

export function watchStateOf(data: ProgressData, videoId: string, isNew = false): WatchState {
  const entry = data.videos[videoId];
  if (entry?.done) return "watched";
  if (entry) return "in-progress";
  return isNew ? "new" : "unwatched";
}
