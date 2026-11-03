"use client";

import { useSyncExternalStore } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, relativeDate } from "@/lib/format";
import type { Locale } from "@/lib/types";

const DAY = 86_400_000;
const subscribe = () => () => {};
const today = () => Math.floor(Date.now() / DAY);
const serverToday = () => null;

/**
 * "منذ يومين" etc. Prerendered pages can't know today's date, so the server
 * prints the short date and the browser swaps in the relative one.
 */
export function RelativeDate({ iso, locale }: { iso: string; locale: Locale }) {
  const day = useSyncExternalStore(subscribe, today, serverToday);
  return (
    <time dateTime={iso}>
      {day === null ? formatDate(iso, locale) : relativeDate(iso, locale, getDictionary(locale), new Date(day * DAY))}
    </time>
  );
}
