/* Profile form: sheikh ⇄ form values, validation, and the payload for PUT /admin/sheikhs/:id. */
import type { AdminSheikh, Locale, SheikhInput } from "../../api/types";
import type { AdminDictionary } from "../../i18n";
import { isHttpUrl, normalizeTelegram, parseTikTokLine } from "../../lib/links";
import { limits } from "../../rules";

export const LANGS: Locale[] = ["ar", "fr", "kab"];
export type L3 = Record<Locale, string>;

export interface Values {
  name: L3;
  honorific: L3;
  bio: L3;
  monogram: string;
  photo?: string;
  telegram: string;
  tiktok: string;
  youtube: string;
  takesQuestions: boolean;
}

export type Errors = Partial<Record<string, string>>;

export function toValues(s: AdminSheikh): Values {
  const empty = { ar: "", fr: "", kab: "" };
  return {
    name: { ...s.name },
    honorific: { ...empty, ...s.honorific },
    bio: { ...empty, ...s.bio },
    monogram: s.monogram,
    photo: s.photo,
    telegram: s.socials?.telegram ?? "",
    tiktok: s.socials?.tiktok ?? "",
    youtube: s.socials?.youtube ?? "",
    takesQuestions: !!s.takesQuestions,
  };
}

export function validate(v: Values, t: AdminDictionary): Errors {
  const e: Errors = {};
  if (!v.name.ar.trim()) e["name.ar"] = t.validation.required;
  else if (v.name.ar.trim().length < limits.sheikh.nameMin) e["name.ar"] = t.validation.min(limits.sheikh.nameMin);
  if (!v.name.fr.trim()) e["name.fr"] = t.validation.required;
  LANGS.forEach((l) => {
    if (v.name[l].length > limits.sheikh.name) e[`name.${l}`] = t.validation.max(limits.sheikh.name);
    if (v.honorific[l].length > limits.sheikh.honorific) e[`honorific.${l}`] = t.validation.max(limits.sheikh.honorific);
    if (v.bio[l].length > limits.sheikh.bio) e[`bio.${l}`] = t.validation.max(limits.sheikh.bio);
  });
  if ([...v.monogram.trim()].length !== 1) e.monogram = v.monogram.trim() ? t.validation.monogram : t.validation.required;
  if (v.telegram.trim() && !normalizeTelegram(v.telegram)) e.telegram = t.validation.telegramUrl;
  if (v.tiktok.trim() && parseTikTokLine(v.tiktok).kind !== "profile") e.tiktok = t.validation.tiktokUrl;
  if (v.youtube.trim() && !isHttpUrl(v.youtube, ["youtube.com", "youtu.be"])) e.youtube = t.validation.youtubeUrl;
  return e;
}

export function toInput(v: Values): SheikhInput {
  const fill = (x: L3): L3 => ({ ar: x.ar.trim(), fr: x.fr.trim(), kab: x.kab.trim() || x.fr.trim() });
  const tiktok = parseTikTokLine(v.tiktok);
  const honorific = fill(v.honorific);
  const bio = fill(v.bio);
  return {
    name: fill(v.name),
    honorific: honorific.ar || honorific.fr ? honorific : undefined,
    bio: bio.ar || bio.fr ? bio : undefined,
    monogram: v.monogram.trim(),
    photo: v.photo,
    socials: {
      telegram: normalizeTelegram(v.telegram) ?? undefined,
      tiktok: tiktok.kind === "profile" ? tiktok.url : undefined,
      youtube: v.youtube.trim() || undefined,
    },
    takesQuestions: v.takesQuestions,
  };
}
