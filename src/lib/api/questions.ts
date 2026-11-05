"use client";

import type { Locale } from "@/lib/types";

/*
 * Sending and following anonymous questions.
 *
 * With NEXT_PUBLIC_API_URL set (e.g. https://api.example.com), the calls go to
 * the backend described in docs/specs/0005-questions-and-answers.md:
 *   POST {API}/questions             → { trackingCode, status }
 *   GET  {API}/questions/track/:code → { status, questionId? }
 * Without it the site runs in demo mode: questions are kept in this browser only.
 *
 * Nothing that identifies the visitor is sent: only the question, its topic,
 * the sheikh it is for, its language and the publish consent.
 */

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const KEY = "my-questions-v1";

export const isDemoMode = !API;

export const QUESTION_MIN = 20;
export const QUESTION_MAX = 1500;

export interface NewQuestion {
  sheikhId: string;
  categoryId: string;
  body: string;
  lang: Locale;
  isPublic: boolean;
  /** Honeypot: real visitors never fill it. */
  website?: string;
}

export type TrackStatus = "pending" | "answered" | "rejected";

/** A question sent from this browser, kept so the visitor can follow it without an account. */
export interface SavedQuestion {
  code: string;
  body: string;
  sheikhId: string;
  askedAt: string;
  status: TrackStatus;
  /** Public page of the answer, when answered and published. */
  questionId?: string;
}

/** Readable code without look-alike characters: "K7Q-4M2". */
function makeCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 3).join("")}-${chars.slice(3).join("")}`;
}

export function readSaved(): SavedQuestion[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/* A tiny store so components can read the saved list with useSyncExternalStore. */
const listeners = new Set<() => void>();
const EMPTY: SavedQuestion[] = [];
let cache: SavedQuestion[] | null = null;

export function subscribeSaved(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const getSavedSnapshot = () => (cache ??= readSaved());
export const getSavedServerSnapshot = () => EMPTY;

function writeSaved(list: SavedQuestion[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private mode): the code shown on screen is the only copy.
  }
  cache = list;
  listeners.forEach((l) => l());
}

export function forgetSaved(code: string) {
  writeSaved(readSaved().filter((q) => q.code !== code));
}

export async function submitQuestion(input: NewQuestion): Promise<{ trackingCode: string }> {
  const body = input.body.trim();
  if (input.website) throw new Error("rejected");
  if (body.length < QUESTION_MIN || body.length > QUESTION_MAX) throw new Error("invalid");

  let trackingCode: string;
  if (API) {
    const res = await fetch(`${API}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Credentials are omitted on purpose: no cookie ties the question to the visitor.
      credentials: "omit",
      body: JSON.stringify({ sheikhId: input.sheikhId, categoryId: input.categoryId, body, lang: input.lang, isPublic: input.isPublic }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    trackingCode = (await res.json()).trackingCode;
  } else {
    await new Promise((r) => setTimeout(r, 600));
    trackingCode = makeCode();
  }

  writeSaved([{ code: trackingCode, body, sheikhId: input.sheikhId, askedAt: new Date().toISOString().slice(0, 10), status: "pending" as const }, ...readSaved()].slice(0, 20));
  return { trackingCode };
}

export async function trackQuestion(code: string): Promise<{ status: TrackStatus; questionId?: string } | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  if (API) {
    const res = await fetch(`${API}/questions/track/${encodeURIComponent(clean)}`, { credentials: "omit" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { status: TrackStatus; questionId?: string };
    writeSaved(readSaved().map((q) => (q.code === clean ? { ...q, status: data.status, questionId: data.questionId } : q)));
    return data;
  }
  const saved = readSaved().find((q) => q.code === clean);
  return saved ? { status: saved.status, questionId: saved.questionId } : null;
}
