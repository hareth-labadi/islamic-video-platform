/*
 * Admin panel strings, Arabic first, then French. Kept apart from the public
 * site's dictionaries (src/i18n/dictionaries.ts) so the two can move separately.
 *
 * To add a language (e.g. Taqbaylit): add it to `adminLocales`, then write a
 * dictionary typed `AdminDictionary` next to ar.ts — TypeScript lists every missing string.
 */
import type { Locale } from "@/lib/types";
import { ar, type AdminDictionary } from "./ar";
import { fr } from "./fr";

export type { AdminDictionary };

export const adminLocales = ["ar", "fr"] as const satisfies readonly Locale[];
export type AdminLocale = (typeof adminLocales)[number];

export function isAdminLocale(value: string): value is AdminLocale {
  return (adminLocales as readonly string[]).includes(value);
}

/** Intl tags with Western digits, as on the public site. */
export const intlTag: Record<AdminLocale, string> = { ar: "ar-u-nu-latn", fr: "fr-FR" };

const dictionaries: Record<AdminLocale, AdminDictionary> = { ar, fr };

export function getAdminDictionary(locale: AdminLocale): AdminDictionary {
  return dictionaries[locale];
}
